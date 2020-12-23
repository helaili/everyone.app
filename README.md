# everyone.app

A GitHub App built with [Probot](https://github.com/probot/probot) that Maintains a team with all your organization members. Upon installation, an `everyone` team will be created in your organization and every member added to it. Every new member joining your organization will be added automatically. 

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t everyone.app .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> everyone.app
```

## Contributing

If you have suggestions for how everyone.app could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2020 Alain Hélaïli <helaili@github.com>
