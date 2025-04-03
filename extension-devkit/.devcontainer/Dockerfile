FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

ENV YARN_VERSION 4.3.1
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT 0

WORKDIR /workspace
RUN corepack enable && corepack prepare yarn@${YARN_VERSION} --activate