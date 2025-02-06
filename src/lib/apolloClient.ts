import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
    link: new HttpLink({
        uri: "https://klk-gp.appbase.online/subgraphs/name/klk-mint-bsc", // GraphQL API 地址
        // uri: "http://18.168.16.120:30000/subgraphs/name/nft-mint-test",
        headers: {
            "content-type": "application/json",
        },
        fetchOptions: {
            mode: "cors", // 允许跨域请求
        },
    }),
    cache: new InMemoryCache(),
});

export default client;
