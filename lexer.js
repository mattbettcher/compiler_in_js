'use strict';

class Lexer {
    #pos = 0;
    #buf = null;
    #buflen = 0;
    tok;

    // keyword table
    static #KEYWORDS = [
        'if',
        'else',
        'switch',
    ];
    // Operator table, mapping operator -> token name
    static #OPTABLE = {
        '+':  'PLUS',
        '-':  'MINUS',
        '*':  'MULTIPLY',
        '.':  'PERIOD',
        '\\': 'BACKSLASH',
        ':':  'COLON',
        '%':  'PERCENT',
        '|':  'PIPE',
        '!':  'EXCLAMATION',
        '?':  'QUESTION',
        '#':  'POUND',
        '&':  'AMPERSAND',
        ';':  'SEMI',
        ',':  'COMMA',
        '(':  'L_PAREN',
        ')':  'R_PAREN',
        '<':  'L_ANG',
        '>':  'R_ANG',
        '{':  'L_BRACE',
        '}':  'R_BRACE',
        '[':  'L_BRACKET',
        ']':  'R_BRACKET',
        '=':  'EQUALS'
    };


    // Initialize the Lexer's buffer. This resets the lexer's internal
    // state and subsequent tokens will be returned starting with the
    // beginning of the new buffer.
    constructor(buf) {
        this.#pos = 0;
        this.#buf = buf;
        this.#buflen = buf.length;
        this.tok = this.next();
    }

    // Get the next token from the current buffer. A token is an object with
    // the following properties:
    // - name: name of the pattern that this token matched (taken from rules).
    // - value: actual string value of the token.
    // - pos: offset in the current buffer where the token starts.
    //
    // If there are no more tokens in the buffer, returns null. In case of
    // an error throws Error.
    next() {
        this.#skipnontokens();
        if (this.#pos >= this.#buflen) {
            return null;
        }

        // The char at this.pos is part of a real token. Figure out which.
        var c = this.#buf.charAt(this.#pos);

        // '/' is treated specially, because it starts a comment if followed by
        // another '/'. If not followed by another '/', it's the DIVIDE
        // operator.
        if (c === '/') {
            var next_c = this.#buf.charAt(this.#pos + 1);
            if (next_c === '/') {
                this.tok = this.#process_comment();
                return this.tok
            } else {
                this.tok = {name: 'DIVIDE', value: '/', pos: this.#pos++};
                return this.tok
            }
        } else {
            // Look it up in the table of operators
            var op = Lexer.#OPTABLE[c];
            if (op !== undefined) {
                this.tok = {name: op, value: c, pos: this.#pos++};
                return this.tok;
            } else {
                // Not an operator - so it's the beginning of another token.
                if (this.#isalpha(c)) {
                    this.tok = this.#process_identifier_or_keyword();
                    return this.tok;
                } else if (this.#isdigit(c)) {
                    this.tok = this.#process_number();
                    return this.tok;
                } else if (c === '"') {
                    this.tok = this.#process_quote();
                    return this.tok;
                } else {
                    throw Error('Token error at ' + this.#pos);
                }
            }
        }
    }

    is_token(kind) {
        return this.tok.name == kind;
    }

    is_keyword(word) {
        if (Lexer.#KEYWORDS.includes(word)) {
            return true;
        } else { 
            return false 
        }
    }

    expect(item) {
        if (this.tok.name == item) {
            this.tok = this.next();
            return true;
        } else {
            console.error(`Expected ${item}, got ${this.tok.value}`)
            return false;
        }
    }

    match(item) {
        if (this.is_token(item)) {
            this.tok = this.next();
            return true;
        } else {
            return false;
        }
    }

    keyword(word) {
        if (this.is_keyword(this.tok.value) && this.tok.value == word) {
            this.tok = this.next();
            return true;
        } else { 
            return false 
        }
    }

    #isnewline(c) {
        return c === '\r' || c === '\n';
    }

    #isdigit(c) {
        return c >= '0' && c <= '9';
    }

    #isalpha(c) {
        return (c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z') ||
            c === '_';
    }

    #isalphanum(c) {
        return (c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z') ||
            (c >= '0' && c <= '9') ||
            c === '_';
    }

    #process_number() {
        var endpos = this.#pos + 1;
        while (endpos < this.#buflen && this.#isdigit(this.#buf.charAt(endpos))) {
            endpos++;
        }

        var tok = {
            name: 'NUMBER',
            value: this.#buf.substring(this.#pos, endpos),
            pos: this.#pos
        };
        this.#pos = endpos;
        return tok;
    }

    #process_comment() {
        var endpos = this.#pos + 2;
        // Skip until the end of the line
        var c = this.#buf.charAt(this.#pos + 2);
        while (endpos < this.#buflen && !this.#isnewline(this.#buf.charAt(endpos))) {
            endpos++;
        }

        var tok = {
            name: 'COMMENT',
            value: this.#buf.substring(this.#pos, endpos),
            pos: this.#pos
        };
        this.#pos = endpos + 1;
        return tok;
    }

    #process_identifier_or_keyword() {
        var endpos = this.#pos + 1;
        while (endpos < this.#buflen && this.#isalphanum(this.#buf.charAt(endpos))) {
            endpos++;
        }
        let temp = this.#buf.substring(this.#pos, endpos);
        if (this.is_keyword(temp)) {
            var tok = {
                name: 'KEYWORD',
                value: temp,
                pos: this.#pos
            };
            this.#pos = endpos;
            return tok;
        } else {
            var tok = {
                name: 'IDENTIFIER',
                value: temp,
                pos: this.#pos
            };
            this.#pos = endpos;
            return tok;
        }
    }

    #process_quote() {
        // this.pos points at the opening quote. Find the ending quote.
        var end_index = this.#buf.indexOf('"', this.#pos + 1);

        if (end_index === -1) {
            throw Error('Unterminated quote at ' + this.#pos);
        } else {
            var tok = {
                name: 'QUOTE',
                value: this.#buf.substring(this.#pos, end_index + 1),
                pos: this.#pos
            };
            this.#pos = end_index + 1;
            return tok;
        }
    }

    #skipnontokens() {
        while (this.#pos < this.#buflen) {
            var c = this.#buf.charAt(this.#pos);
            if (c == ' ' || c == '\t' || c == '\r' || c == '\n') {
                this.#pos++;
            } else {
                break;
            }
        }
    }
}

let lex = new Lexer('hello + if world 1234');
console.log(lex.next())
console.log(lex.next())
console.log(lex.expect('else'))
console.log(lex.next())
console.log(lex.next())