# mp-sdk-tutorial

## Setup
```shell
git clone https://github.com/IvanFarkas/mp_sdk_tutorial.git
cd mp_sdk_tutorial
yarn install
```

## Download and extract the latest Bundle SDK
```shell
curl https://static.matterport.com/showcase-sdk/bundle/3.1.35.16-9-g01b2a7b60/showcase-bundle.zip -o bundle.zip
unzip bundle.zip -d ./bundle
```

## Set SDK key
Replace [SdkKey] to the SDK Key in:

- [index.html](https://github.com/IvanFarkas/mp_sdk_tutorial/blob/main/index.html)
- [/src/index.ts](https://github.com/IvanFarkas/mp_sdk_tutorial/blob/main/src/index.ts)

## Useful Links

- [SDK Overview](https://matterport.github.io/showcase-sdk/sdkbundle_home.html)
- [Tutorial](https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_setup.html)
- [Examples](https://matterport.github.io/showcase-sdk/sdkbundle_examples_summary.html)
- [Reference](https://matterport.github.io/showcase-sdk/docs/sdkbundle/reference/current/index.html)
- [Scene](https://matterport.github.io/showcase-sdk/docs/sdkbundle/reference/current/modules/scene.html)

[![Screenshot ](https://raw.githubusercontent.com/IvanFarkas/mp_sdk_tutorial/master/Captura.PNG)]