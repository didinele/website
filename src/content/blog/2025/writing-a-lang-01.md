---
title: Writing a language - Lexing and parsing (Part 1)
publishDate: 2025-04-07
tags: dev,lang,rust
---

## Introduction

A few years back, I read Robert Nystrom's [Crafting Interpreters](https://craftinginterpreters.com/) and followed along
using C#. Since then, parsers have been a big fascination of mine and I was rather surprised at how applicable
basic parsing techniques are to a variety of problems. For instance, using recursive descent, one can easily
implement a simple JSON parser.

I've dabbled with writing a language before, but my perfectionist tendencies have always gotten in the way. Fast forward
to now, I'm a first year CS student and got a lot more "I just need to get this done" in me now, so I figured it was time
to give it another go.

## Why Rust?

Rust has been my go-to language whenever I'm not using TypeScript. I think it's an incredibly powerful language
that has widely redefined what I like about a language to begin with. I'm glad to see that the new-age of languages
(Rust, Zig and Go) approach things at least a little different in core areas like nullability and error handling.

## What does a language look like conceptually?

We can, at large, think about it as a chain of transformations. We start with strings of characters (input files),
map them into some intermediate representation (typically an AST), and then we can spin up an interpreter or look
into compiling into some other language (be that an actual language like C/C++ or machine code the CPU can directly execute).

In this first post (and probably the next), I'll be covering most of that first stage. Also, I won't be talking much
about the actual design. I'm aiming for a low-level, heavily Rust-inspired language.

## Lexing

Before we get to something resembling an AST, we usually want to do some basic work on our input. We want to think about
slightly more abstract things than just characters. Be that a "comment", a "string literal", a "less than operator",
a "keyword", etc. This is generally called a "token", and a "lexer" or "scanner" is the thing that takes our input and
turns it into tokens.

```rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum TokenKind {
    // 1 char
    Dot,
    Comma,
    Colon,
    Semicolon,
    LeftCurly,
    RightCurly,
    LeftParen,
    // --- snip ---
    Less,

    // 2 char
    EqualsEquals,
    BangEquals,
    GreaterEquals,
    // --- snip ---
    Arrow,

    // literals
    String,
    Number,

    // Keywords
    True,
    False,
    If,
    Else,
    // --- snip ---
    Static,

    // Misc
    Comment,
    Identifier,

    // Internal
    EOF,
}
```

Great! Onto the lexer itself, my initial thought was to abstract most of my compiler pipeline into `Iterator` impls.
This, by design, would've been highly lazy (parser lazily asks for tokens from our lexer as it needs them), but we quickly
run into relatively complicated language semantics. Ultimately, I decided it's not really worth it considering how
quickly down the line we end up needing an eager result (e.g. we need a complete AST to type-check).

### Some considerations

One thing I needed to begin considering was how to do error handling. A key design aspect in modern languages is to
be able to recover from common syntax errors. This is usually done by making some assumptions about what the user _meant_
when something is wrong. For instance, if we can't find a closing `"`, there's some cases where we can try to guess
where it should be. Have the following examples the lexer handles at this time:

```
fn("something);
let x = "something;
fn("something, "something else");
```

In essence, we can memorize positions for characters like `)`, `;`, `,` that we run into as we look for the closing `"`
and, if the input ends without a closing quote, we can jump back to our memorized position, pretend a quote was there,
push an error and continue lexing.

Other than that, and an "unknown character" error, our lexer can't run into any other errors, things like unclosed
brackets is something the parser should deal with depending on the context.

On the topic of errors, I opted for [miette](https://crates.io/crates/miette) for reporting. They offer
Rust-like errors relatively easily:

```rs
#[derive(Error, Diagnostic, Debug)]
#[diagnostic()]
pub enum CompilerError {
    // I/O & CLI
    // -- snip --
    #[error("No main file found")]
    #[help("The compiler looks for a file named main.firm inside the src directory.")]
    NoMainFileFound,

    // Lexer errors
    #[error("Encountered an unterminated string literal")]
    UnterminatedStringLiteral {
        #[label("here")]
        at: SourceSpan,
        #[label("try adding a closing quote here")]
        advice: Option<SourceSpan>,
        fatal: bool,
    },
    #[error("Unknown character")]
    UnknownCharacter {
        #[label("here")]
        at: SourceSpan,
    },

    // -- snip --
}
```

And an example output:

```
Error:   × Encountered errors during compilation

Error:
  × Ran into one or more errors while compiling main.firm

Error:
  × Unexpected token
   ╭─[2:5]
 1 │ enum Foo {
 2 │     pub Bar,
   ·     ─┬─
   ·      ╰── here
 3 │ }
   ╰────
  help: Expected an identifier or `}`

Error:
  × Unexpected token
   ╭─[5:1]
 4 │
 5 │ pub pub struct ThisIsAStruct {
   · ─┬─
   ·  ╰── here
 6 │     a: u32,
   ╰────
  help: Try removing the 2nd `pub`
```

During my implementation cycles, I found myself aggregating `char`s and constructing `String`s a lot for storing things
like string literals. I realized that this is an added layer of indirection and allocations that we don't need. The source
code that we read from the input files is immutable, so we can just store slices of the original input.

This could be a _disaster_ in terms of lifetimes, we'd need a lifetime parameter basically everywhere to tell rustc that
our slice lives long enough. Unless... Rust offers a tool just for this purpose when you want your string to live as long as the program.
`pub fn leak<'a>(self) -> &'a mut str`. From the signature, we see that this takes ownership of `self`, meaning we can no
longer use our `String`, nor will it ever be freed, but we can now use the returned `&str`, which is implicitly `'static`.

```rs
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Token {
    kind: TokenKind,
    span: SourceSpan,
}
```

And for convenience we give our tokens a method to get the source code span from the original input:

```rs
impl Token {
    pub fn src(&self, src: &'static str) -> &'static str {
        &src[self.span.offset()..self.span.offset() + self.span.len()]
    }
}
```

With all this under our belt, we're ready to lex!

```rs
#[derive(Debug)]
pub struct LexerResult {
    pub tokens: Vec<Token>,
    pub errors: Vec<CompilerError>,
    pub fatal: bool,
}

#[derive(Debug)]
pub struct Lexer {
    input: Peekable<std::str::Chars<'static>>,
    offset: usize,
    errors: Vec<CompilerError>,
}

impl Lexer {
    pub fn new(src: &'static str) -> Self {
        Self {
            input: src.chars().peekable(),
            offset: 0,
            errors: vec![],
        }
    }

    // -- snip --
}
```

Note the `fatal` field on `LexerResult`. This flag indicates that we shouldn't continue on with parsing.

```rs
pub fn lex(mut self) -> LexerResult {
    let mut tokens = vec![];

    loop {
        match self.try_get_token() {
            Some(token) => match token.kind() {
                TokenKind::EOF => {
                    tokens.push(token);
                    break;
                }
                _ => tokens.push(token),
            },
            // We encountered an error
            None => continue,
        }
    }

    let mut fatal = false;
    let errors = self
        .errors
        .into_iter()
        .inspect(|err| {
            if err.is_fatal() {
                fatal = true;
            }
        })
        .collect();

    LexerResult {
        tokens,
        errors,
        fatal,
    }
}
```

The `EOF` token is a bit special. It probably wasn't needed, but it felt natural to implement now rather than come back
later if it helped with the parser semantics. The `try_get_token` is where the magic happens (this lexer arhitecture
is a bit reflective of the previous approach where the `Lexer` had no public methods, but implemented `Iterator` instead).
Either way, I won't stress all the implementation details here - that can be viewed [here](https://github.com/didinele/firm/blob/f4c6837d41d961645cc313fe0b62922ba2bd2214/src/lexer/mod.rs#L47) - but let's walk through a couple of things.

```rs
fn span_now(&mut self, len: usize) -> SourceSpan {
    let span = SourceSpan::new(self.offset.into(), len);
    self.offset += len;
    span
}

fn token_now(&mut self, kind: TokenKind, len: usize) -> Token {
    Token::new(kind, self.span_now(len))
}

fn try_get_token(&mut self) -> Option<Token> {
    match self.input.next() {
        // 1/2 char tokens
        Some(c) => Some(match c {
            '.' => self.token_now(TokenKind::Dot, 1),
            ',' => self.token_now(TokenKind::Comma, 1),
            ':' => self.token_now(TokenKind::Colon, 1),
            ';' => self.token_now(TokenKind::Semicolon, 1),
            '{' => self.token_now(TokenKind::LeftCurly, 1),
            '}' => self.token_now(TokenKind::RightCurly, 1),
            '(' => self.token_now(TokenKind::LeftParen, 1),
            ')' => self.token_now(TokenKind::RightParen, 1),
            '[' => self.token_now(TokenKind::LeftSquare, 1),
            ']' => self.token_now(TokenKind::RightSquare, 1),
            '+' => {
                if self.input.next_if_eq(&'=').is_some() {
                    self.token_now(TokenKind::PlusEquals, 2)
                } else if self.input.next_if_eq(&'+').is_some() {
                    self.token_now(TokenKind::PlusPlus, 2)
                } else {
                    self.token_now(TokenKind::Plus, 1)
                }
            }
            '-' => {
                if self.input.next_if_eq(&'=').is_some() {
                    self.token_now(TokenKind::MinusEquals, 2)
                } else if self.input.next_if_eq(&'-').is_some() {
                    self.token_now(TokenKind::MinusMinus, 2)
                } else {
                    self.token_now(TokenKind::Minus, 1)
                }
            }
            // --- snip ---
        }),
        None => Some(self.token_now(TokenKind::EOF, 0)),
    }
}
```

And something a bit more interesting:

```rs
// Whitespace
' ' | '\r' | '\t' | '\n' => {
    self.offset += 1;
    return None;
}
// Keywords and identifiers
c => {
    if c.is_digit(10) {
        let mut len = 1;
        while self
            .input
            .peek()
            .is_some_and(|c| c.is_digit(10) || *c == '.')
        {
            len += 1;
            self.input.next().unwrap();
        }

        self.token_now(TokenKind::Number, len)
    } else if c.is_alphanumeric() || c == '_' {
        let mut identifier = String::from(c);
        while self
            .input
            .peek()
            .is_some_and(|c| c.is_alphanumeric() || *c == '_')
        {
            identifier.push(self.input.next().unwrap());
        }

        // Check if the identifier is a keyword
        match identifier.as_str() {
            "true" => self.token_now(TokenKind::True, 4),
            "false" => self.token_now(TokenKind::False, 5),
            "if" => self.token_now(TokenKind::If, 2),
            "else" => self.token_now(TokenKind::Else, 4),
            "while" => self.token_now(TokenKind::While, 5),
            "for" => self.token_now(TokenKind::For, 3),
            "return" => self.token_now(TokenKind::Return, 6),
            "break" => self.token_now(TokenKind::Break, 5),
            "continue" => self.token_now(TokenKind::Continue, 8),
            "function" => self.token_now(TokenKind::Function, 8),
            "let" => self.token_now(TokenKind::Let, 3),
            "import" => self.token_now(TokenKind::Import, 6),
            "as" => self.token_now(TokenKind::As, 2),
            "type" => self.token_now(TokenKind::Type, 4),
            "pure" => self.token_now(TokenKind::Pure, 4),
            "const" => self.token_now(TokenKind::Const, 5),
            "struct" => self.token_now(TokenKind::Struct, 6),
            "enum" => self.token_now(TokenKind::Enum, 4),
            "pub" => self.token_now(TokenKind::Pub, 3),
            "static" => self.token_now(TokenKind::Static, 6),
            _ => self.token_now(TokenKind::Identifier, identifier.len()),
        }
    }
// -- snip--
}
```

## Parsing

This is where things get a bit more complicated. For starters, we need to finish thinking about the output of our parser.
So far, I've used phrases like "resemble an AST". A big issue with traditional ASTs is the deep recursion that consumers
subject themselves to. "Pointer chasing" is also a problem that can lead to poor performance, due to CPU cache misses.

Something clever we can do that doesn't stray too far is a "flat AST". Instead of thinking of a "root node" with pointers
to its top-level children (struct, enum, function definitions, each of them also having children), we'll have a vector
for each of those top-level constructs. Things further down the "tree" are represented as an index into a larger vector.

For example to express a type alias definition (`type Example = Foo<Bar>;`), we use the following struct

```rs
/// Denoted by the `type` keyword
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TypeStmt {
    pub name: &'static str,
    pub is_pub: bool,
    pub span: SourceSpan,
    pub definition: usize,
}
```

Type definitions are stored in a `Vec<TypeStmt>`, and each instance's `definition` is an index into a larger `Vec<Stmt>`,
where `Stmt` is our top-level language construct (everything in Firm is a statement; expressions are statements that yield
values):

```rs
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Stmt {
    Import(ImportStmt),
    Function(FunctionStmt),
    Enum(EnumStmt),
    Type(TypeStmt),
    Struct(StructStmt),

    Expr(Expr),
}
```

A drawback with this approach is that a `Stmt`s size is given by the size of its largest possible variant, meaning
we introduce a fair share of memory overhead, and also require a "cast" into the appropriate variant when we index
into our `Vec<Stmt>`. Rust gives us a lot of useful tooling to get past this semantic hurdle, so we won't worry about it
too much; we'll probably think about it once we need to consume our AST.

For now, it'd still be good if we introduced something to help us do this indexing:

```rs
impl TypeStmt {
    pub fn definition<'a>(&self, nodes: &'a [Stmt]) -> &'a Stmt {
        &nodes[self.definition]
    }
}
```

## Proc macros are not so scary

This quickly gets _very_ repetitive. We also have to consider fields where the related node is optional (like an `else`
branch), there's multiple related nodes (blocks with multiple expressions), and so on. As I started working on this
project, Logan Smith came out with a great [introductive video](https://youtu.be/SMCRQj9Hbx8?si=unRBt8pPPf0vPlht) to proc macros.
I'm gonna spare most of the details, but you can see the full implementation [here](https://github.com/didinele/firm/blob/f4c6837d41d961645cc313fe0b62922ba2bd2214/firm_macros/src/lib.rs).

Overall, this simplifies our definition to

```rs
/// Denoted by the `type` keyword
#[derive(Debug, Clone, PartialEq, Eq, AstNode)]
pub struct TypeStmt {
    pub name: &'static str,
    pub is_pub: bool,
    pub span: SourceSpan,
    #[related]
    pub definition: usize,
}
```

Interestingly, `AstNode` isn't even a real trait. Derive proc macros just sort of let you make one up during the macro
export:

```rs
#[proc_macro_derive(
    AstNode,
    attributes(related, related_maybe, related_many, related_many_maybe)
)]
pub fn ast_node(item: TokenStream) -> TokenStream {
    let node = parse_macro_input!(item as ParsedAstNode);
    quote! { #node }.into()
}
```

Derive macros can generate totally arbitrary code, in our case, we generate a regular impl for the input struct.

Another note-worthy example:

```rs
#[derive(Debug, Clone, PartialEq, Eq, AstNode)]
pub struct FunctionStmt {
    pub span: SourceSpan,
    pub name: &'static str,
    pub is_pub: bool,
    pub is_pure: bool,
    pub arg_names: Vec<&'static str>,
    #[related_many]
    pub arg_types: (usize, usize),
    #[related_maybe]
    pub return_type: Option<usize>,
    #[related]
    pub body: usize,
}
```

`#[related_many]` expects `(start_index, amount)` and returns a slice into our `nodes` within that bound.

With most of this down, let's write our parser output type, with `associated` being the special vector we spoke about earlier:

```rs
#[derive(Debug, Default)]
pub struct ApplicationFile {
    pub imports: Vec<ImportStmt>,
    pub enums: Vec<EnumStmt>,
    pub types: Vec<TypeStmt>,
    pub structs: Vec<StructStmt>,
    pub associated: Vec<Stmt>,
}
```

## Parsing (for real this time)

To parse, we'll simply loop over the tokens our lexer returned until we encounter `TokenKind::EOF`. We match the
token against allowed top-level constructs (like structs, functions, imports, types), after which we enter specialized parsing logic.
For instance, let's have a look at imports:

```
import x
import y as z
```

After `import`, an identifier is supposed to follow:

```rs
let identifier = parser_unwrap!(next_of_type!(
    self.tokens.next().expect(BAD_NEXT_MSG),
    self.errors,
    TokenKind::Identifier,
    placeholder_span_from(&token.span())
));
```

Once again, to not bore with many details, we use some macros built around our parser to do most of the heavy lifting,
but effectively, we

1. Read the next token
2. If it's EOF, we stop the parsing process with an unexpected EOF error, otherwise, we continue
3. Check if it's the given type (`TokenKind::Identifier`), if so, we return the token
4. Push an unexpected token error to `self.errors` and construct a placeholder token at a vaguely related span,
   allowing us to simply continue.

This allows us to very trivially recover from most errors, that effectively just consist of the user using the wrong sort
of token. It's also relatively simple to introduce specialized recovery logic in case we have a very good guess about
what the user meant (for instance, if we expect an identifier but find a string literal, we can just assume the user
did not mean to add the quote marks, rather than utterly give up and effectively leave the symbol unnamed, which will
likely cause further errors during the type-checking phase), but at this time, things are left to be fairly simple.

Anyways, after this identifier, we look for the optional `as`, and, if present, we also parse one more identifier:

```rs
let alias = if self
    .tokens
    .peek()
    .is_some_and(|token| token.kind() == TokenKind::As)
{
    // Consume the `as` token
    let as_token = self.tokens.next().unwrap();
    Some(parser_unwrap!(next_of_type!(
        self.tokens.next().expect(BAD_NEXT_MSG),
        self.errors,
        TokenKind::Identifier,
        placeholder_span_from(&as_token.span())
    )))
} else {
    None
};
```

If you're curious about other constructs, you can see the full parser [here](https://github.com/didinele/firm/blob/f4c6837d41d961645cc313fe0b62922ba2bd2214/src/parser/mod.rs).

To wrap up this post, let's sketch up a quick CLI using [clap](https://crates.io/crates/clap):

```rs
#[derive(Parser)]
#[command(version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Build a firm project
    Build {
        /// Path root to the project to compile. Inside of this dir, files inside of src/ are seeked.
        /// If not provided, the current working directory is used.
        root: Option<String>,
        /// How many threads to use for compilation. By default, the number of logical cores is used.
        threads: Option<usize>,
    },
}
```

Our `build` command is relatively boring, we just look for `.firm` files in the target directory, read the source code
(`.leak()` it as I mentioned!), lex & parse it. There's a bit of extra error handling (not finding a `src` dir or a
`main.firm` file, I/O errors, etc).

Thankfully, our parsing process is isolated to a single file (we don't need context about other files to parse through),
so we can fully parallelize this process. Probably not the option, but I opted for [threadpool](https://crates.io/crates/threadpool).

Here's how this all looks:

```rs
let file_count = files.len();
let pool = match threads {
    Some(threads) => ThreadPool::new(threads),
    None => ThreadPool::default(),
};

// (FilePath, (SourceCode, Parsed))
let (tx, rx) = std::sync::mpsc::channel::<(String, (Option<&'static str>, ParserResult))>();
for path in files {
    let tx = tx.clone();
    let root = root.clone();

    pool.execute(move || {
        let src = std::fs::read_to_string(path.clone());
        let src = match src {
            Ok(src) => src,
            Err(inner) => {
                tx.send((
                    path,
                    (
                        None,
                        ParserResult::with_pre_parse_errors(vec![
                            CompilerError::IOError { inner },
                        ]),
                    ),
                ))
                .expect(THREAD_BUG_MSG);
                return;
            }
        };

        let src = src.leak();

        let lexer = lexer::Lexer::new(src);
        let lexed = lexer.lex();
        if lexed.fatal {
            tx.send((
                path,
                (Some(src), ParserResult::with_pre_parse_errors(lexed.errors)),
            ))
            .expect(THREAD_BUG_MSG);
            return;
        }

        let parser = parser::Parser::new(src, lexed);
        let file = parser.parse();

        // At this point, let's strip the start of the path (i.e. <root>/src/)
        let path = path
            .strip_prefix(&format!("{}/src/", root))
            .unwrap_or(&path)
            .to_string();
        tx.send((path, (Some(src), file))).expect(THREAD_BUG_MSG);
    });
}

let files = rx.iter().take(file_count).collect::<HashMap<_, _>>();

if !files.contains_key("main.firm") {
    return Err(CompilerError::NoMainFileFound.into());
}

// TODO. Continue the compiler. Type checker, optimizer, code gen, etc.

// Lastly, collect errors for the final report if we got this far
let file_errors = files
    .into_iter()
    .filter_map(|(file_name, (source_code, ParserResult { errors, .. }))| {
        if errors.is_empty() {
            None
        } else {
            Some(FileErrors {
                file_name,
                source_code,
                errors,
            })
        }
    })
    .collect::<Vec<_>>();

if !file_errors.is_empty() || !other_errors.is_empty() {
    return Err(CompilerErrors {
        file_errors,
        other_errors,
    }
    .into());
}
```

## Recap

We now have

- a complete lexer
- a representation for our language with helpful generation macros
- a (not complete! at this time, I have not finished implementing functions, which are arguably the most complex) parser

Next time

- complete parser (likely won't be talking about it any longer unless I encounter new interesting problems)
- type checker
- optimizer
