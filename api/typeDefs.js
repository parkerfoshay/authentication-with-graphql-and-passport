import { gql } from 'apollo-server-express';
const typeDefs = gql`
  type User {
    id: ID
    facebookId: String
    firstName: String
    lastName: String
    email: String
  }
  type Query {
    currentUser: User
  }
  type Mutation {
    logout: Boolean
  }
`;
export default typeDefs;