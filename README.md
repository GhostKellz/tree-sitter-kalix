# tree-sitter-kalix

[![npm](https://img.shields.io/npm/v/tree-sitter-kalix.svg)](https://www.npmjs.com/package/tree-sitter-kalix)

Tree-sitter grammar for [Kalix](https://github.com/ghostkellz/kalix), a smart contract language for Hedera and ZVM.

## Features

- **Complete syntax support** for Kalix smart contracts
- **Syntax highlighting** via `.scm` query files
- **Code navigation** with textobjects and locals
- **100% test coverage** with corpus tests

## Installation

### npm

```bash
npm install tree-sitter-kalix
```

### From source

```bash
git clone https://github.com/ghostkellz/tree-sitter-kalix
cd tree-sitter-kalix
npm install
npm run build
```

## Usage

### With tree-sitter CLI

```bash
# Parse a file
tree-sitter parse example.kalix

# Test the grammar
tree-sitter test

# Generate highlighting
tree-sitter highlight example.kalix
```

### With Neovim

Add to your nvim-treesitter configuration:

```lua
local parser_config = require("nvim-treesitter.parsers").get_parser_configs()
parser_config.kalix = {
  install_info = {
    url = "https://github.com/ghostkellz/tree-sitter-kalix",
    files = {"src/parser.c"},
    branch = "main",
  },
  filetype = "kalix",
}
```

### With Grove (Zig tree-sitter wrapper)

```zig
const grove = @import("grove");

var parser = try grove.Parser.init(allocator);
defer parser.deinit();

const language = try grove.Languages.kalix.get();
try parser.setLanguage(language);

const source = "contract Token { state totalSupply: u64; }";
var tree = try parser.parseUtf8(null, source);
defer tree.deinit();
```

## Language Overview

Kalix is a smart contract language for the Hedera network and ZVM runtime.

### Example Contract

```kalix
contract Treasury {
    state balance: u64;
    table deposits: Map<Address, u64>;
    event Deposit(from: Address, amount: u64);

    fn deposit(amount: u64) payable {
        let mut total = amount;
        state.balance = state.balance + total;
    }

    fn getBalance() view -> u64 {
        return state.balance;
    }
}
```

### Supported Syntax

- **Contracts**: `contract Name { ... }`
- **State variables**: `state name: Type;`
- **Tables**: `table name: Map<K, V>;`
- **Events**: `event Name(param: Type);`
- **Functions**: `fn name(params) qualifiers body`
  - Qualifiers: `view`, `payable`, `pub`
  - Return types: `-> Type`
- **Statements**: `let`, `return`, blocks, expressions
- **Expressions**: Binary ops, unary ops, calls, member access
- **Types**: Primitives (`u8`-`u128`, `i8`-`i128`, `bool`, `string`, `bytes`, `Address`, `Hash`), generics (`Map<K,V>`)
- **Literals**: Integers (decimal, hex `0x`, binary `0b`), strings, booleans
- **Comments**: `//` line comments, `/* */` block comments

## Query Files

This grammar includes comprehensive query files for editor integration:

- **`queries/highlights.scm`** - Syntax highlighting
  - Keywords, types, functions, variables
  - Literals, operators, punctuation
  - Comments

- **`queries/locals.scm`** - Variable scoping
  - Contract, function, and block scopes
  - Definitions (contracts, states, tables, events, functions, parameters, variables)
  - References

- **`queries/textobjects.scm`** - Code navigation
  - Functions (outer/inner)
  - Contracts (class outer)
  - Blocks, parameters, calls
  - Comments

## Testing

```bash
# Run all corpus tests
npm test

# Parse example file
npm run parse test.kalix

# Generate parser
tree-sitter generate
```

## Development

### Grammar Structure

The grammar is defined in `grammar.js` and follows the PEG specification from the [Kalix language docs](https://github.com/ghostkellz/kalix/blob/main/docs/lang/grammar.peg).

Key AST nodes:

- `source_file` - Root node
- `contract_declaration` - Contract definitions
- `state_declaration` - State variable declarations
- `table_declaration` - Table declarations
- `event_declaration` - Event declarations
- `function_declaration` - Function definitions
- `let_statement`, `return_statement`, `expression_statement` - Statements
- `binary_expression`, `unary_expression`, `call_expression`, `member_expression` - Expressions

### Adding Tests

Add test cases to `test/corpus/*.txt`:

```
==================
Test name
==================

contract Test {
    state x: u64;
}

---

(source_file
  (contract_declaration
    name: (identifier)
    (state_declaration
      name: (identifier)
      type: (type_expression
        (type_identifier)))))
```

## Integration

### With GhostLS (Language Server)

tree-sitter-kalix is designed to integrate with [GhostLS](https://github.com/ghostkellz/ghostls) via [Grove](https://github.com/ghostkellz/grove):

```
tree-sitter-kalix (parser.c)
    ↓
Grove (Zig tree-sitter wrapper)
    ↓
GhostLS (LSP server)
    ↓
Editor (VSCode, Neovim, Grim)
```

See the [integration guide](https://github.com/ghostkellz/kalix/blob/main/GHOSTLS_INTEGRATION_LSP.md) for details.

## Contributing

Contributions welcome! Please:

1. Add tests for new syntax features
2. Update query files if adding new node types
3. Run `npm test` before submitting PRs

## License

MIT

## Links

- [Kalix compiler](https://github.com/ghostkellz/kalix)
- [Grove (tree-sitter wrapper)](https://github.com/ghostkellz/grove)
- [GhostLS (LSP server)](https://github.com/ghostkellz/ghostls)
- [Tree-sitter](https://tree-sitter.github.io/)

## References

- [Kalix Language Spec](https://github.com/ghostkellz/kalix/blob/main/docs/lang/syntax.md)
- [PEG Grammar](https://github.com/ghostkellz/kalix/blob/main/docs/lang/grammar.peg)
- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/creating-parsers)
