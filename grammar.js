/**
 * Tree-sitter grammar for Kalix
 *
 * Kalix is a smart contract language for Hedera/ZVM
 * Based on grammar.peg specification from kalix/docs/lang/grammar.peg
 */

module.exports = grammar({
  name: 'kalix',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.call_expression, $.member_expression],
  ],

  rules: {
    // Module <- _ ContractDecl* EOF
    source_file: $ => repeat($.contract_declaration),

    // ContractDecl <- 'contract' __ Identifier __ '{' _ ContractItem* '}' _
    contract_declaration: $ => seq(
      'contract',
      field('name', $.identifier),
      '{',
      repeat($._contract_item),
      '}'
    ),

    // ContractItem <- StateDecl / TableDecl / EventDecl / FnDecl
    _contract_item: $ => choice(
      $.state_declaration,
      $.table_declaration,
      $.event_declaration,
      $.function_declaration,
    ),

    // StateDecl <- 'state' __ Identifier _ ':' _ TypeExpr _ ';' _
    state_declaration: $ => seq(
      'state',
      field('name', $.identifier),
      ':',
      field('type', $.type_expression),
      ';'
    ),

    // TableDecl <- 'table' __ Identifier _ ':' _ TypeExpr _ ';' _
    table_declaration: $ => seq(
      'table',
      field('name', $.identifier),
      ':',
      field('type', $.type_expression),
      ';'
    ),

    // EventDecl <- 'event' __ Identifier _ '(' _ EventParamList? _ ')' _ ';' _
    event_declaration: $ => seq(
      'event',
      field('name', $.identifier),
      '(',
      optional($.event_parameter_list),
      ')',
      ';'
    ),

    // EventParamList <- EventParam (_ ',' _ EventParam)*
    event_parameter_list: $ => seq(
      $.event_parameter,
      repeat(seq(',', $.event_parameter))
    ),

    // EventParam <- Identifier _ ':' _ TypeExpr
    event_parameter: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $.type_expression)
    ),

    // FnDecl <- 'fn' __ Identifier _ '(' _ ParamList? _ ')' _ FnQual* _ ReturnType? _ Block
    function_declaration: $ => seq(
      'fn',
      field('name', $.identifier),
      '(',
      optional($.parameter_list),
      ')',
      repeat($.function_qualifier),
      optional($.return_type),
      field('body', $.block)
    ),

    // FnQual <- 'view' __ / 'payable' __ / 'pub' __
    function_qualifier: $ => choice(
      'view',
      'payable',
      'pub'
    ),

    // ReturnType <- '->' _ TypeExpr
    return_type: $ => seq('->', $.type_expression),

    // ParamList <- Param (_ ',' _ Param)*
    parameter_list: $ => seq(
      $.parameter,
      repeat(seq(',', $.parameter))
    ),

    // Param <- Mutability? Identifier _ ':' _ TypeExpr
    parameter: $ => seq(
      optional($.mutability),
      field('name', $.identifier),
      ':',
      field('type', $.type_expression)
    ),

    // Mutability <- 'mut' __ / 'const' __
    mutability: $ => choice('mut', 'const'),

    // TypeExpr <- Identifier TypeArgs?
    type_expression: $ => seq(
      $.type_identifier,
      optional($.type_arguments)
    ),

    // TypeArgs <- _ '<' _ TypeExpr (_ ',' _ TypeExpr)* _ '>'
    type_arguments: $ => seq(
      '<',
      $.type_expression,
      repeat(seq(',', $.type_expression)),
      '>'
    ),

    // Block <- '{' _ Statement* '}' _
    block: $ => seq(
      '{',
      repeat($._statement),
      '}'
    ),

    // Statement <- LetStmt / ReturnStmt / ExprStmt / Block
    _statement: $ => choice(
      $.let_statement,
      $.return_statement,
      $.expression_statement,
      $.block,
    ),

    // LetStmt <- 'let' __ Mutability? Identifier _ '=' _ Expression _ ';' _
    let_statement: $ => seq(
      'let',
      optional($.mutability),
      field('name', $.identifier),
      '=',
      field('value', $._expression),
      ';'
    ),

    // ReturnStmt <- 'return' (_ Expression)? _ ';' _
    return_statement: $ => seq(
      'return',
      optional($._expression),
      ';'
    ),

    // ExprStmt <- Expression _ ';' _
    expression_statement: $ => seq($._expression, ';'),

    // Expression <- Assignment
    _expression: $ => choice(
      $.assignment_expression,
      $.binary_expression,
      $.unary_expression,
      $.call_expression,
      $.member_expression,
      $.primary_expression,
    ),

    // Assignment <- LogicalOr (_ '=' _ Assignment)?
    assignment_expression: $ => prec.right(1, seq(
      field('left', choice($.identifier, $.member_expression)),
      '=',
      field('right', $._expression)
    )),

    // Binary expressions with proper precedence
    binary_expression: $ => {
      const table = [
        [prec.left, 10, '||'],  // LogicalOr
        [prec.left, 11, '&&'],  // LogicalAnd
        [prec.left, 12, choice('==', '!=')],  // Equality
        [prec.left, 13, choice('<=', '>=', '<', '>')],  // Comparison
        [prec.left, 14, choice('+', '-')],  // Term (AddOp)
        [prec.left, 15, choice('*', '/', '%')],  // Factor (MulOp)
      ];

      return choice(...table.map(([assoc, precedence, operator]) =>
        assoc(precedence, seq(
          field('left', $._expression),
          field('operator', operator),
          field('right', $._expression)
        ))
      ));
    },

    // Unary <- UnaryOp Unary / Call
    unary_expression: $ => prec(16, seq(
      field('operator', choice('!', '-')),
      field('operand', $._expression)
    )),

    // Call <- Primary (ArgumentList / MemberAccess)*
    call_expression: $ => prec(17, seq(
      field('function', choice($.identifier, $.member_expression)),
      field('arguments', $.argument_list)
    )),

    // ArgumentList <- _ '(' _ Arguments? _ ')'
    argument_list: $ => seq(
      '(',
      optional($.arguments),
      ')'
    ),

    // Arguments <- Expression (_ ',' _ Expression)*
    arguments: $ => seq(
      $._expression,
      repeat(seq(',', $._expression))
    ),

    // MemberAccess <- _ '.' _ Identifier
    member_expression: $ => prec(18, seq(
      field('object', choice($.identifier, $.member_expression)),
      '.',
      field('property', $.identifier)
    )),

    // Primary <- Literal / Identifier / Grouped
    primary_expression: $ => choice(
      $.literal,
      $.identifier,
      $.grouped_expression,
    ),

    // Grouped <- '(' _ Expression _ ')'
    grouped_expression: $ => seq('(', $._expression, ')'),

    // Literal <- BoolLiteral / StringLiteral / IntegerLiteral
    literal: $ => choice(
      $.boolean_literal,
      $.string_literal,
      $.integer_literal,
    ),

    // BoolLiteral <- 'true' !IdentChar / 'false' !IdentChar
    boolean_literal: $ => choice('true', 'false'),

    // StringLiteral <- '"' StringChar* '"'
    string_literal: $ => seq(
      '"',
      repeat(choice(
        $.escape_sequence,
        /[^"\\]/
      )),
      '"'
    ),

    // Escape <- '\\' ["\\nrt]
    escape_sequence: $ => token.immediate(seq(
      '\\',
      choice(
        '"',
        '\\',
        'n',
        'r',
        't'
      )
    )),

    // IntegerLiteral <- HexInt / BinInt / DecInt
    integer_literal: $ => token(choice(
      seq('0x', /[0-9a-fA-F_]+/),  // HexInt
      seq('0b', /[01_]+/),          // BinInt
      /[0-9][0-9_]*/                // DecInt
    )),

    // Type identifier (for built-in types and user types)
    type_identifier: $ => choice(
      // Primitive types
      'u8', 'u16', 'u32', 'u64', 'u128',
      'i8', 'i16', 'i32', 'i64', 'i128',
      'bool', 'string', 'bytes',
      'Address', 'Hash',
      // Generic types
      'Map',
      // User-defined type
      $.identifier
    ),

    // Identifier <- !Keyword IdentStart IdentPart*
    identifier: $ => {
      const alpha = /[_A-Za-z]/;
      const alphanumeric = /[_A-Za-z0-9]/;
      return token(seq(alpha, repeat(alphanumeric)));
    },

    // Comment <- LineComment / BlockComment
    comment: $ => token(choice(
      seq('//', /.*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/'
      )
    )),
  }
});
