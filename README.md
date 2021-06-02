# mp-sdk-tutorial

## Setup
```shell
git clone https://github.com/IvanFarkas/mp_sdk_tutorial.git
cd mp_sdk_tutorial
yarn install
```

## Download and extract the latest Bundle SDK
```shell
curl https://static.matterport.com/showcase-sdk/bundle/3.1.41.5-19-g5133fdd3e/showcase-bundle.zip -o bundle.zip
unzip bundle.zip -d ./bundle
rm bundle.zip
```

## Set Configuration in .env file
Replace `[SdkKey]` to the SDK Key

```
MODEL_ID=22Ub5eknCVx
SDK_KEY=[SdkKey]
SDK_VERSION="3.10"
```

## Useful Links

- [SDK Overview](https://matterport.github.io/showcase-sdk/sdkbundle_home.html)
- [Tutorial](https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_setup.html)
- [Examples](https://matterport.github.io/showcase-sdk/sdkbundle_examples_summary.html)
- [Reference](https://matterport.github.io/showcase-sdk/docs/sdkbundle/reference/current/index.html)
- [Scene](https://matterport.github.io/showcase-sdk/docs/sdkbundle/reference/current/modules/scene.html)
