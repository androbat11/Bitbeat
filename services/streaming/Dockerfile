# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM rust:1-slim AS builder

WORKDIR /app

# Cache dependencies before copying source
COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Compile real source (dependencies already cached)
COPY src/ ./src/
RUN touch src/main.rs && cargo build --release

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/streaming .

EXPOSE 3003

CMD ["./streaming"]
