FROM node:24-slim AS node-base
WORKDIR /notesnet

RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node-base AS frontend
RUN --mount=type=bind,source=src/client,target=src/client \
    --mount=type=bind,source=index.html,target=index.html \
    --mount=type=bind,source=vite.config.ts,target=vite.config.ts \
    --mount=type=bind,source=tsconfig.json,target=tsconfig.json \
    --mount=type=bind,source=assets-compressor.mts,target=assets-compressor.mts \
    pnpm build

FROM node-base AS backend-node
RUN pnpm prune --prod --no-optional

FROM rust:1.93-trixie AS backend-rust
WORKDIR /notesnet

COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main() -> std::process::ExitCode {println!("build failed :("); return std::process::ExitCode::FAILURE}' > src/main.rs && cargo build --release && rm src/main.rs
COPY --exclude=src/client src ./src
RUN --mount=type=bind,source=migrations,target=migrations \
    touch src/main.rs && cargo build --release

FROM gcr.io/distroless/nodejs24-debian13:nonroot
WORKDIR /notesnet
COPY --from=backend-rust /notesnet/target/release/notesnet ./notesnet
COPY --from=frontend /notesnet/dist ./dist
COPY ./package.json ./
COPY --from=backend-node /notesnet/node_modules ./node_modules
COPY ./src/server ./src/server

EXPOSE 3000
CMD ["./src/server/index.ts"]