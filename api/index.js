import express from 'express';

import session from 'express-session';
import uuid from 'uuid/v4.js';
import passport from 'passport';
import FacebookStrategy from 'passport-facebook';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from './typeDefs.js';
import resolvers from './resolvers.js';
import User from './User.js';

const PORT = 4000;

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const users = User.getUsers();
  const matchingUser = users.find((user) => user.id === id);
  done(null, matchingUser);
});

const app = express();

const facebookOptions = {
  clientID: '1470034763351974',
  clientSecret: '36c62e93a247209c84de1dea2acf52e3',
  callbackURL: 'https://271c-2600-8800-4a10-f700-8523-ab08-be3a-f1c2.ngrok.io/auth/facebook/callback',
  profileFields: ['id', 'email', 'first_name', 'last_name'],
};

const facebookCallback = (accessToken, refreshToken, profile, done) => {
  const users = User.getUsers();
  const matchingUser = users.find((user) => {
      console.log(user);
      return user.facebookId === profile.id;
  });
  if (matchingUser) {
    done(null, matchingUser);
    return;
  }
  const newUser = {
    id: uuid(),
    facebookId: profile.id,
    firstName: profile.name.givenName,
    lastName: profile.name.familyName,
    email: profile.emails && profile.emails[0] && profile.emails[0].value,
  };
  
  users.push(newUser);
  
  done(null, newUser);
};

passport.use(new FacebookStrategy(facebookOptions, facebookCallback));

const startServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: (req) => ({
      getUser: () => {
          console.log(req);
            return req.user;
        },
      logout: () => req.logout(),
    }),
  });

  await server.start();
  server.applyMiddleware({ app });
  console.log(`Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
};

startServer();

const SESSION_SECRECT = 'bad secret';

app.use(
  session({
    genid: (req) => uuid(),
    secret: SESSION_SECRECT,
    resave: false,
    saveUninitialized: false,
  })
);


app.use(passport.initialize());
app.use(passport.session());
app.use('/ok',  passport.authenticate('facebook', { session: true }));
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: 'https://271c-2600-8800-4a10-f700-8523-ab08-be3a-f1c2.ngrok.io/graphql',
  failureRedirect: 'http://localhost:4000/graphql',
}));

app.listen({ port: PORT }, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});
