'use strict';

class Expr {
    type;
    value;
    ls;
    rs;
    op;

    static TYPE = ['OPERAND', 'BINOP', ];

    constructor() {

    }

    new_bin_op(op, ls, rs) {
        this.op = op;
        this.ls = ls;
        this.rs = rs;
        this.type = 'BINOP';
    }

    new_number(value) {
        this.value = value;
        this.type = 'OPERAND';
    }
}