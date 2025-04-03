# How to run this example

Follow the [Installation steps](#installation) below and start the devcontainer
You will immediately notice an error about a missing file `api/__generated__/definition.js`. This is normal because we'll need to deploy the models.

```tip
The errors are displayed above the EXTENSION DEVKIT ascii art so it may require to scroll up a bit.
```

Stop the dev server (ctrl/cmd + c) and in a new terminal (in the same container) run `yarn deploy-models`.
On the first run, you will have to restart the ceramic container (the script will guide you). After restart run the same command again and the models should now be deployed.

Start the dev server (`yarn dev`) and this time it should start without any errors.

Follow the [Setup and Development Workflow](https://docs.akasha.world/devkit/setup/) guide and after the step 6, instead of creating it locally (as instructed in step 7), click on the `Add Details` button and fill out the required fields in the wizard (description, and at least one tag).

Now click on the `...` dropdown menu on the newly created extension card and from the dropdown select `Publish Extension` and in the next screen click on the `Publish` button.

After publishing, click on `Go to my extensions` and using the same dropdown menu, select `Release Manager`.
Here we will click on `Create release` and then complete the release details as follows:

```
Version Number: 1.0.0
Description: <this release description>
Source URL: <MainFile url from the devkit>
```

Of course, this release is a dummy one and it will only work in localhost, but we are just developing it so it's ok.

Now you can continue with step 8 of the [Setup and Development Workflow](https://docs.akasha.world/devkit/setup/)


# Extension Devkit for Worlds

The [Devkit](https://github.com/AKASHAorg/extension-devkit) (available on Github) is a starter kit that allows you to develop extensions compatible with [AKASHA Core](https://github.com/AKASHAorg/akasha-core)

## Features

- [Typescript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Shadcn](https://ui.shadcn.com/)
- [AKASHA React Hooks](https://github.com/AKASHAorg/akasha-core/tree/next/libs/hooks)
- [AKASHA React Apollo Hooks](https://github.com/AKASHAorg/akasha-core/blob/next/libs/hooks/README_GENERATED.md)
- [AKASHA SDK](https://github.com/AKASHAorg/akasha-core/tree/next/libs/sdk)
- Live Reload - reloads the extension, on file change

## Installation

To get started with Devkit, clone the [repository](https://github.com/AKASHAorg/extension-devkit) from Github

### Using DevContainers (Recommended)

This repository contains the configuration for running it in `DevContainers`, which is highly recommended.

**Prerequisites**

- Docker
- An IDE or text editor that has support for DevContainers (VSCode, Webstorm, Cursor, etc.)

:::info
This guide was tested extensively using VSCode, hence some command shortcuts may differ a bit for your preferred editor. Please consult the corresponding documentation for more information
:::

**Steps**

1. Open the project with your editor and make sure you have the devcontainer extension installed (VSCode will prompt you with the recommendation to install it)
2. Open the project in devcontainer
   - VSCode will prompt you to do it if you have the extension installed.
3. Follow the on-screen instructions (on the terminal) on how to get it mounted into a world

:::tip
In any case you missed the prompt, you can always run the project in DevContainer through the command palette.

For VSCode, press `SHIFT + COMMAND + P` to open the command palette, then search for and select `Dev Containers: Reopen in Container`. If you made any changes to the files (including container and docker configuration files) earlier, you may use `Dev Containers: Rebuild and Reopen in Container`
:::

### Manual installation

If you do not want to use DevContainers, you can setup the project manually

**Prerequisites**

- [`yarn (v4.3.1 or newer)`](https://yarnpkg.com/getting-started/install)

**Steps**

1. Install dependencies using `yarn install`
2. Run `yarn dev` to start the dev server
3. Follow the on-screen instructions (on the terminal) on how to get it mounted into a world

## Next Steps

Now that we have set up and run the project (locally or on DevContainer), please visit [Setup and Development Workflow](https://docs.akasha.world/devkit/setup/) for detailed guide on how to get the extension mounted into a world.

## Troubleshooting

1. I get some errors when I try to start the project in DevContainers on VSCode, what should I do?

   - Ensure you have the project opened as a folder and not in a workspace on VSCode

2. Can I run the project locally after running it in the DevContainers?

   - Yes you can, however you need to re-install the packages and build the project again before continuing

3. I get an `Address already in use error` trying to run the project locally after I forcefuly exited the Devcontainer
   - This is most likely because the container instance on Docker wasn't gracefuly shut down from the DevContainer and hence was still using the specified port. Open your Docker application or use the CLI to shut down the extension-devkit container before re-attempting to run it locally

4. I want to run the project again on DevContainers after making a few changes or running it locally, how do I proceed?
   - First, make sure you have stopped the script on the local terminal, then proceed to search and select the appropriate command from the command palette to `Rebuild and Reopen in DevContainers`


