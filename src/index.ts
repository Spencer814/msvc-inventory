import { ApolloServer, gql } from 'apollo-server';
import { buildFederatedSchema } from '@apollo/federation';

interface ProductsProduct {
  upc: string;
  name?: string;
  price?: number;
  weight?: number;
  first?: number;
}

interface Product extends ProductsProduct {
  inStock?: boolean;
  shippingEstimate?(_: Product): number;
}

const typeDefs = gql`
  extend type Product @key(fields: "upc") {
    upc: String! @external
    weight: Int @external
    price: Int @external
    inStock: Boolean
    shippingEstimate: Int @requires(fields: "price weight")
  }
`;

const resolvers = {
  Product: {
    __resolveReference(product: Product) {
      return {
        ...product,
        ...inventory.find(p => p.upc === product.upc),
      };
    },
    shippingEstimate(product: Product) {
      // free for expensive items
      if (product?.price ?? 0 > 1000) return 0;
      // estimate is based on weight
      return product?.weight ?? 1 * 0.5;
    },
  },
};

const server = new ApolloServer({
  schema: buildFederatedSchema([
    {
      typeDefs,
      resolvers,
    },
  ]),
});

server.listen({ port: 4003 }).then(({ url }) => {
  console.log(`🚀 Inventory service ready at ${url}`);
});

const inventory: Product[] = [
  { upc: '1', inStock: true },
  { upc: '2', inStock: false },
  { upc: '3', inStock: true },
];
