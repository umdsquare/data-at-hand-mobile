# Data@Hand

<img src="https://img.shields.io/badge/platform-ios%7Candroid-green"/> <img src="https://img.shields.io/badge/framework-react%20native-blue"/> <img src="https://img.shields.io/badge/language-typescript%20%7C%20swift%20%7C%20java-lightblue"/> 

A multimodal fitness application supporting both touch and speech input for data exploration.

**This project is currently under heavy development.**

### Related Research Paper (Contains design and user study)
**Data@Hand: Fostering Visual Exploration of Personal Data on Smartphones Leveraging Speech and Touch Interaction**<br>
Young-Ho Kim, Bongshin Lee, Arjun Srinivasan, and Eun Kyoung Choe<br>
ACM CHI 2021 (conditionally accepted)




### How to build & run

Install Node.js on your system.



Install react-native CLI:

  ```sh
  > npm install -g @react-native-community/cli
  ```
  
Install dependencies 
  (In the directory of the repository where package.json exists)
  ```sh
  > npm i
  ```

#### Run on IOS:

  If you have not used Cocoapods before, install it once:
  ```sh
  > sudo gem install cocoapods
  ```
  
  Install iOS project dependencies.
  ```sh
  > cd ios
  > pod install
  ```

  Run on iOS.
  ```sh
  > react-native run-ios
  ```

#### Run on Android:
  ```sh
  > react-native run-android
  ```
  

---
## Third-party Services Used
- [Fitbit REST API](https://dev.fitbit.com/build/reference/web-api/) (Setup required)
- [Microsoft Cognitive Service (Speech-to-Text)](https://azure.microsoft.com/en-us/services/cognitive-services/speech-to-text/) (Optional. Android only)
- [Bugsnag](https://www.bugsnag.com/) (Optional. Error reporting)



----

## License

### Source Code
MIT License

### Original Design Resources including Logos and Assets
CC BY 4.0
