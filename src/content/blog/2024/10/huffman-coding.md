---
title: Implementing Huffman coding in C
publishDate: 2024-10-28
tags: dev,uni,project
---

Starting this October, I am a first year Computer Science student at the University of Bucharest 🎉

One of the classes I've been enjoying is "Computer Systems Arhitecture". Last week, we were introduced to the notion of
Entropy in Information Theory. The way our professor introduced it was amusing, because it seemed completely devoid
from any relevant Computer Science, but rather just seemed like... Statistics. Things got a bit interesting when
we were told the Entropy value could be thought of as a theoretical limit for how good a compression algorithm could get.

We were shown Huffman as an example right after, and it had been a _long_ time since I toyed with a language outside of
my comfort zone. I [dabbled](https://github.com/didinele/bf-rs) with Rust a fair share in the past, but this course has
me writing x86 Assembly, so I figured I'd use the next best thing, C. I was pretty excited at the prospect of a fun little
side-project (ideas that I actually like and that I can reasonably bring to completion are rare for me), so I got to writing
immediately without paying attention to the rest of the lecture.

The first obvious hurdle was that I had never written C. My experience with C/C++ was limited to C++ in VS2019/VS2022.
I quickly spun up a project with CMake, taking a [friend's C project as inspiration](https://github.com/novara754/software-rasterizer),
and found myself getting used to the rather unfamiliar pattern of writing a struct and the matching `init_X` and `free_X`
functions.

Anyways, I got to working on encoding. The first step is counting how many times each
character in our input shows up. I decided I'd only support encoding ASCII text files,
so the most trivial way to count is to just initialize an array like so:

```c
int count[256] = {0};
```

such that `count[x]` is the number of times `x` has shown up (where `x` is an
`unsigned char`).

One traversal later, and we're interested in beginning to create our Huffman tree.
The other parts of our API are also interested in knowing how many initial nodes
we're working with, so I designed the API like so:

```c
struct TreeNodeList
{
    struct TreeNode **nodes;
    int length;
};

// -- snip --
struct TreeNodeList *node_list_from_file(FILE *file);
```

Converting from our `int count[256]` to a `TreeNodeList`, once again, is trivial assuming we
counted the number of unique characters from the get-go, so I'll be omitting the code for
it, but it can be found [here](https://github.com/didinele/huffman-c/blob/8df2bd97274f95dc54bde1be3c002ee90d9a7505/src/tree.c#L47-L79).

Great, so now we have an array of nodes, we just have to arrange them into our tree.
The algorithm is super simple:

1. Sort our nodes array by their "weights" (e.g. how many times the character showed up)
2. Create a new node, where `node->left` is the node with the lowest weight and
   `node->right` is the node with the 2nd lowest weight, it takes the place of its now-children in our list.
3. If the length of our list is now 1, return its only element (our completed tree),
   otherwise return to step 1.

Obviously, this is not the best for performance when implemented literally this way.
Calling `qsort` every single time is rather terrible, but I just wanted to get things to work.

Interestingly, even with this naive approach with poor time complexity, I spent
by _far_ the most time on this function. I had it working fairly fast, but running
`leaks -atExit -- ./src/huffman-c` would constantly yell at me about unfreed memory, uh-oh.

This was definitely _the_ moment I missed C++ the most. This sucked a ton more than
all the nice STL data structures I was missing, smart pointers would've made this an
infinitely quicker job. Rust would've also made this a lot nicer to with its ownership rules
(or how much easier it is to just copy data semantically speaking).

As I was hunting down the leaks, I ran into other problems, like accidentally copying
pointers to the same heap-allocated `TreeNode` and re-using them, leading to really confusing bugs. Ultimately,
I gave up on any sensible behavior and decided to just literally _always_ copy
my data. Bit more debugging with `leaks` later, and we landed on this (very not clean)
implementation:

```c
struct TreeNode *build_tree_root(struct TreeNodeList *list)
{
    if (list->length == 1)
    {
        return list->nodes[0];
    }

    qsort(list->nodes, list->length, sizeof(struct TreeNode *), &compare_nodes);

    struct TreeNode *new_node = malloc(sizeof(struct TreeNode));
    init_node(new_node, list->nodes[0]->weight + list->nodes[1]->weight, '\0');

    struct TreeNode *left = malloc(sizeof(struct TreeNode));
    memcpy(left, list->nodes[0], sizeof(struct TreeNode));
    free(list->nodes[0]);
    new_node->left = left;

    struct TreeNode *right = malloc(sizeof(struct TreeNode));
    memcpy(right, list->nodes[1], sizeof(struct TreeNode));
    free(list->nodes[1]);
    new_node->right = right;

    list->nodes[0] = new_node;

    memcpy(&list->nodes[1], &list->nodes[2], (list->length - 2) * sizeof(struct TreeNode *));
    list->length--;

    return build_tree_root(list);
}
```

Awesome! Now that we have our tree, we can get to encoding. But first, I figured
I'd add another extra useful layer of abstraction, a sort of "dict", mapping each
character to the string of bits that reached the correct leaf node in our tree.

One preorder traversal later, and we have our dict. Once again, this is pretty simple, but you can have a look at that
[here](https://github.com/didinele/huffman-c/blob/8df2bd97274f95dc54bde1be3c002ee90d9a7505/src/dict.c#L20-L62).

Onto the _actually_ cool stuff, we need to encode (compress, really!) our data, now.
Naturally, the first thing I thought of is splitting the file into a header and a body.
Our header will hold our tree, since it's the only thing we really need for decoding,
while the body itself will be our characters expressed as their respective Huffman codes.

Let's start with the header. Some quick Googling about the best way to encode a binary
tree into a file, and I learned about Succint encoding, which I used as inspiration.

Here's what I ended up with:

```c
static inline void write_tree_node(FILE *out, struct TreeNode *node)
{
#define WRITE_TYPE(type) fwrite(&type, sizeof(unsigned char), 1, out)

    if (node == NULL)
    {
        // Write a 0 to indicate that this node is null
        unsigned char type = 0;
        WRITE_TYPE(type);

        return;
    }

    if (node->symbol == 0)
    {
        // 1 for node with no data
        unsigned char type = 1;
        WRITE_TYPE(type);
    }
    else
    {
        // 2 is for node with data
        unsigned char type = 2;
        WRITE_TYPE(type);

        // Write the symbol for our leaf
        fwrite(&node->symbol, sizeof(unsigned char), 1, out);
    }

    // Write the left and right children
    write_tree_node(out, node->left);
    write_tree_node(out, node->right);

#undef WRITE_TYPE
}
```

So, we read our file byte by byte using this recursive preorder function. `0 0` means
there's no children (we have a leaf), `1 0` means there's only a left-hand side child
(and so on). `2` is functionally the same as `1`, except it tells the decoder that the
next byte is actually the `symbol` (i.e. character) associated with that node.

The main thing I'd improve here is probably implementing some decoder tricks around
type `2`. With the structure of Huffman trees, only leafs contain data to begin with,
so type `2` _could_ make the following `0 0` redundant, but this is good enough for now.

Next up, we have our body. The main thing that stumped me was how to deal with byte
alignment. After all, our data format could (is actually quite likely) to create an output
where the number of bits isn't a multiple of 8. In retrospect, especially with how
simple the solution I landed on is, this was a silly thing to get stuck on.

We start with an array of bits. I chose to work with `bool`s, since it seemed simpler
to me:

```c
bool bits_buf[8] = {0};
int bits_buf_index = 0;

int c;
while ((c = fgetc(in)) != EOF)
{
    struct DictEntry entry = dict[c];
    for (int i = 0; i < entry.length; i++)
    {
        bits_buf[bits_buf_index++] = entry.code[i];
        if (bits_buf_index == 8)
        {
            unsigned char byte = bit_array_to_byte(bits_buf);
            fwrite(&byte, sizeof(unsigned char), 1, out);
            bits_buf_index = 0;
        }
    }
}
```

We build up byte after byte and flush it to our file. Ultimately, we simply
check how many bits our last byte is missing (e.g. we could have only `10101` so far)
and pad _on the right_ with 0s. This isn't enough though, since with our example, we would
end up with `10101000`. Those last 3 `0`s could potentially produce an additional
character when decoding, so we need to ensure we ignore them.

We simply write how much we padded by as one last byte to our file:

```c
unsigned char padding = 0;

if (bits_buf_index > 0)
{
    while (bits_buf_index < 8)
    {
        bits_buf[bits_buf_index++] = 0;
        padding++;
    }

    unsigned char byte = bit_array_to_byte(bits_buf);
    fwrite(&byte, sizeof(unsigned char), 1, out);
}

fwrite(&padding, sizeof(unsigned char), 1, out);
```

Decoding follows much of the same principles: we read the header
recursively. Encountering `0`s as children is what allows us to eventually exit
without knowing the size of the tree before hand, and from here, we do a few reading tricks:

```c
// We need the last byte to tell how much padding we have, but first let's save where we are
long pos = ftell(bin);

int padding;
fseek(bin, -1, SEEK_END);

fread(&padding, sizeof(unsigned char), 1, bin);

// Now rewind
fseek(bin, pos, SEEK_SET);
```

Aaaand using a nice util function that allows us to look 2 bytes ahead (since we want
to stop on the byte _before_ our padding byte) we parse through, bit after bit, walk our
tree until we hit a leaf, at which point we write its associated symbol to a custom
`DynString` and reset:

```c
int byte;
while ((byte = fgetc(bin)) != EOF)
{
    bool last = fpeek2(bin) == EOF;

    // If our condition is true, we're on our last byte,
    // which is the padding we already read
    unsigned char bits_to_read = last ? 8 - padding : 8;

    for (unsigned char i = 0; i < bits_to_read; i++)
    {
        bool bit = byte & (1 << (7 - i));

        root = bit ? root->right : root->left;

        // If we're at a leaf, write the symbol
        if (root->symbol != '\0')
        {
            push_to_dyn_string(string, root->symbol);
            // Reset the root
            root = root_copy;
        }
    }

    if (last)
    {
        break;
    }
}
```

And there we have it. Let's compress a larger file (104MBs of lorem ipsum) and see how much we save:

```
huffman-c via △ v3.30.5
❯ ./build/src/huffman-c encode ./original.in ./encoded.out
huffman-c via △ v3.30.5
huffman-c on via △ v3.30.5
❯ ls | grep -e original.in -e encoded.out
.rw-r--r--@  55M didinele 29 Oct 12:10 encoded.out
.rw-r--r--@ 104M didinele 29 Oct 12:09 original.in
```

Seems like it works! Let's also decode back, and verify that our original file is the same as the decoded one:

```
huffman-c via △ v3.30.5
❯ ./build/src/huffman-c decode ./encoded.out ./decoded.out

huffman-c via △ v3.30.5
❯ diff --brief <(sort ./original.in) <(sort ./decoded.out)
```

No diff! 🎉

I had a blast with this project & learned a fair share. I hope I'll find the drive to this sort of thing more often.
