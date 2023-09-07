FROM denoland/deno:1.36.4
EXPOSE 8000

# Prefer not to run as root.
USER deno

# These steps will be re-run upon each file change in your working directory:
ADD . .

CMD ["run", "--allow-net", "--allow-read", "server.ts"]
