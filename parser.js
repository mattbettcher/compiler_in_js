'use strict';

class Parser {
    #lex;

    static #ADD_OPS = ['+', '-'];
    static #MUL_OPS = ['*', '/'];

    constructor(code) {
        this.#lex = new Lexer(code);
    }

    expr() {
        return this.add_expr();
    }

    add_expr() {
        let expr = this.mul_expr();
        while (this.#is_add_op()) {
            let op = this.#lex.tok.value;
            this.#lex.next();
            let e = new Expr();
            e.new_bin_op(op, expr, this.mul_expr());
            return e;
        }
        return expr;
    }

    mul_expr() {
        let expr = this.operand();
        while (this.#is_mul_op()) {
            let op = this.#lex.tok.value;
            this.#lex.next();
            let e = new Expr();
            e.new_bin_op(op, expr, this.operand());
            return e;
        }
        return expr;
    }

    operand() {
        // terminal items or (expr)
        if (this.#lex.is_token('NUMBER')) {
            let e = new Expr();
            e.new_number(this.#lex.tok.value);
            this.#lex.next();
            return e;
        } else if (this.#lex.match('L_PAREN')) {
            let expr = this.expr();
            this.#lex.expect('R_PAREN');
            return expr;
        }
    }

    #is_add_op() {
        if (Parser.#ADD_OPS.includes(this.#lex.tok.value)) {
            return true
        } else {
            return false
        }
    }

    #is_mul_op() {
        if (Parser.#MUL_OPS.includes(this.#lex.tok.value)) {
            return true
        } else {
            return false
        }
    }
}

let p = new Parser('(2 + 3) * 4')
console.log(p.expr());