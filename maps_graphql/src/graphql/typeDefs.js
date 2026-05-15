export const typeDefs = `#graphql
  type PlaceLocation {
    id: ID!
    title: String!
    lat: Float
    lng: Float
  }

  type Query {
    locations: [PlaceLocation]
  }
`;