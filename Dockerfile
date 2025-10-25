# FROM node:22.13.0

# WORKDIR /app

# COPY package.json pnpm-lock.yaml ./

# RUN npm install -g pnpm && pnpm install --frozen-lockfile

# COPY . .

# # RUN pnpm build

# EXPOSE 5009

# CMD ["pnpm", "run","dev"]

############################################################


FROM node:22.13.0

WORKDIR /app

# Set up environment variables for pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV SHELL="/bin/bash"

COPY package.json pnpm-lock.yaml ./

# Install pnpm first
RUN npm install -g pnpm && mkdir -p /pnpm

# Install ALL dependencies (including dev dependencies for TypeScript compilation)
RUN pnpm install

COPY . .

# Install typescript globally and build
RUN pnpm install -g typescript && pnpm build


# RUN pnpm install --production

EXPOSE 5009

CMD ["pnpm","run","dev"]