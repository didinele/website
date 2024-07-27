---
title: My experience writing this website
publishDate: 2024-07-26
tags: dev,life
---

I've never been a fan of frontend. Fundamentally, I started writing code by working on Discord bots. I didn't know what a "backend"
or a "frontend" was, but what I was doing certainly didn't involve any UI... Or well, did it? Ultimately, despite doing things
purely on the server side, working with HTTP APIs, WebSockets, SQL, Redis, Node.JS, ORMs, and all sorts of other stuff,
I was ultimately designing UI/UX for the end-user, just via whatever Discord's API allowed me to do.

This did not at all translate well to the web. The web is a very flexible platform, it feels like
whenever you try to do even the simplest thing, you're met with a dozen different ways to do it, SEO for documentation
sites isn't great, so more often than not googling how to do "X" leaves you with those awkward click-farming articles
that are relatively outdated - and even when you do discover a way of doing something, it's possible it just doesn't work
in your context!

More modern tools have made things a lot easier. React components make a lot of sense to me - in fact, I've grown to really
enjoy doing state management and data fetching in React, and there've been full-stack projects where despite being
responsible for backend with someone else on the frontend, I found myself writing code for them when they were stuck
on working with a new API. Tailwind also makes a lot more sense to me, it just feels like I can _find_ what I need
to a better extent.

That being said, there are times when I'll finally get something looking how I want it to, only to be told that
my approach is semantically incorrect - which is important! - there are some things I simply don't know, and won't know
without doing more frontend work. It sort of takes me back to my early school days. I used to think chemistry was
the worst subject because, unlike other classes, you genuinely just had so much to memorize. In hindsight, having studied
other subjects that I enjoy at a higher level, and also by speaking with various people in chemistry, I've come to realize
that while, indeed, at that entry level there is a fair share of memorization, there's always logic and reasoning behind
it. Beginning to have that deep understanding within your mind makes the reactions you once had to memorize seem like
second nature.

Similarly, whenever I try accomplishing something with CSS, and feel frustrated with it not working, the correct approach
is probably something I just didn't know about yet, discovering it will further my understanding of that concept, and why
the 2 different approaches exist, and why works in my context, while the other doesn't.

This website is a [fork](https://wnelson.dev). That has helped me so much. I found it a little exciting because it's written
in Astro+SolidJS, which I've never used before. I'm kind of in love with Astro for this sort of site, but Solid is not
necessarily my cup of tea. I haven't gotten to grasp why the slightly different approach to state from React
is meant to be beneficial, but so far I just found certain things annoying. I'm sure with more use, I'll come to appreciate
it as well. Yesterday, I spent the whole day working on this (8 hours or so cumulative), and for the first time,
I felt like I was making progress on a frontend. I never felt completely stuck, instead, I managed to style
the site to my liking, fix a few bugs, and even add a completely new feature (the blog tags!). I'm really proud of myself,
and I'm excited and hopeful that I'll be able to integrate frontend work into my hobby projects more often in the future.

[automoderator.app](https://automoderator.app) was a project with a fair share of financial incentive, our web developer
was paid, probably more than I was, despite me doing everything else while also coordinating them. I'm in the stage of
rewriting everything there, this time purely as a hobby project, and I dreaded the idea of revisiting the frontend. Now,
I feel like I have a shot.
