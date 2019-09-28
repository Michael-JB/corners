# corners

A browser implementation of a traditional Russian board game with a CPU opponent.

## Try it out

This game is served in a free tier Heroku container: https://corners-game.herokuapp.com.

## Usage

- Install Dependencies: `npm install`
- Build: `npm run build`
- Serve: `npm start`, then navigate to http://localhost:5000

A full NodeJS server is used to allow for easy future integration of server side calculation. Currently the server only serves static files, and calculation is all in the browser.

## Game rules

The goal of the game is to recreate your opponents starting position with your pieces. On your turn, you can only move a single piece. This piece can either move to an adjacent square, after which your turn ends, or it can hop over an individual adjacent piece. You can perform as many hops as you like on your turn, provided consecutive hops are not cyclic.

## Built with

- [TypeScript](http://www.typescriptlang.org/) - Client & Server language
- [NodeJS](https://nodejs.org/) & [ExpressJS](https://expressjs.com/) - Web framework
- [npm](https://www.npmjs.com/) - Dependency management
- [Heroku](https://www.heroku.com/) - Cloud hosting

## License

[MIT license](./LICENSE)