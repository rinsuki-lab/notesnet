FROM node:24-slim AS frontend
WORKDIR /notesnet

RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
RUN --mount=type=bind,source=src/client,target=src/client \
    --mount=type=bind,source=index.html,target=index.html \
    pnpm vite build

FROM rust:1.93-trixie AS backend
WORKDIR /notesnet

COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main() -> std::process::ExitCode {println!("build failed :("); return std::process::ExitCode::FAILURE}' > src/main.rs && cargo build --release && rm src/main.rs
COPY --exclude=src/client src ./src
RUN --mount=type=bind,source=.sqlx,target=.sqlx \
    touch src/main.rs && cargo build --release

FROM gcr.io/distroless/cc-debian13:nonroot
WORKDIR /notesnet
COPY --from=frontend /notesnet/dist ./dist
COPY --from=backend /notesnet/target/release/notesnet ./notesnet

EXPOSE 3000
CMD ["./notesnet"]