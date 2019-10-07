# Contributing

First of all, thanks for wanting to contribute with rel-events! :)

Before I go into the details, I need to make the standard disclaimers:
- if you would like a new feature, it would be nice to discuss it before we accept any incoming PRs. We reserve ourselves the right to reject a feature that was not discussed or that will impact the code or API in a meaningful way. In that case, open an issue so we can discuss it thoroughly.
- be nice to each other, please! No misogyny, racism, ableism or any kind of discrimination will be tolerated here.

With that said, let's start!

### How do I contribute?

The first step to contribute is to fork the project to your github account. You can do that by clicking the 'Fork' button at the top of the page (up there ^).

With that done, you'll have your copy of the project to play around. You then need to clone your fork, by running `git clone <your-fork-repository>` on your terminal.

Then, with your branch cloned locally, go inside the project folder (`cd` into it) and install the development dependencies. For that, you'll need to have [node and npm set up](https://nodejs.org/en/download/current/). We recommend getting the "Current" version or, even better, the version described inside the `.nvmrc` file on the root folder.

Now you should have the `npm` command on your terminal. Inside the project's folder, run `npm install --dev` to install the project's dependencies. After it runs, you'll have a `node_modules` folder. Run `npm test` just to be sure everything installed correctly.

You're ready to go! Create yourself a new branch for your feature/bugfix and commit what you need. We added a git hook that will prevent you from commiting if the tests and linting fail, though, so be aware of that. I personally like to run `npm test` and `npm run lint` before every commit. When it's ready to be merged, push your feature/bugfix branch to your fork and open a Pull Request on github, targeting our `master` branch.

That's about it! Any questions, don't hesitate to contact me at `luciano@labcodes.com.br`. Thanks, and hope it all goes well :D
