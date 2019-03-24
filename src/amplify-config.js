// This file is used for manual configuration of the Amplify library.
// When Amplify is used in conjunction with the Amplify CLI toolchain or AWS Mobile Hub to manage backend resources,
// an aws-exports.js file is auto-generated and can be used instead of the below to automatically configure the Amplify library.
// In this workshop, we are using the Amplify client libraries without the CLI toolchain so you should edit this file manually.

const awsConfig = {
    Auth: {
        identityPoolId: 'ap-southeast-2:687f1ba1-1242-4f22-8adf-da49297c8005', // example: 'us-east-2:c85f3c18-05fd-4bb5-8fd1-e77e7627a99e'
        region: 'ap-southeast-2', // example: 'us-east-2'
        userPoolId: 'ap-southeast-2_3e18SkGuR', // example: 'us-east-2_teEUQbkUh'
        userPoolWebClientId: '5k4a2nd0euhv8bfaugepk8b4kf', // example: '3k09ptd8kn8qk2hpk07qopr86'
    },
    API: {
        endpoints: [
            {
                name: 'CustomersAPI',
                endpoint: 'https://j383ee0ls6.execute-api.ap-southeast-2.amazonaws.com/dev/customers', // example: 'https://u8swuvl00f.execute-api.us-east-2.amazonaws.com/prod'
                region: 'ap-southeast-2' // example: 'us-east-2'
            },
			{
                name: 'ProductsAPI',
                endpoint: 'https://j383ee0ls6.execute-api.ap-southeast-2.amazonaws.com/dev/products', // example: 'https://u8swuvl00f.execute-api.us-east-2.amazonaws.com/prod'
                region: 'ap-southeast-2' // example: 'us-east-2'
            },
			{
                name: 'OrderAPI',
                endpoint: 'https://j383ee0ls6.execute-api.ap-southeast-2.amazonaws.com/dev/orders', // example: 'https://u8swuvl00f.execute-api.us-east-2.amazonaws.com/prod'
                region: 'ap-southeast-2' // example: 'us-east-2'
            },
			{
                name: 'VariantsAPI',
                endpoint: 'https://j383ee0ls6.execute-api.ap-southeast-2.amazonaws.com/dev/variations', // example: 'https://u8swuvl00f.execute-api.us-east-2.amazonaws.com/prod'
                region: 'ap-southeast-2' // example: 'us-east-2'
            }
        ]
    },
    Storage: {
        bucket: '', //example: 'wildrydesbackend-profilepicturesbucket-1wgssc97ekdph'
        region: '' // example: 'us-east-2'
    }
}
console.log('Build Environment:');
console.log(process.env.BUILD_ENV);
export default awsConfig;
