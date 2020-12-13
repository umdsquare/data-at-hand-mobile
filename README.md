# Data@Hand

<img src="https://img.shields.io/badge/platform-ios%7Candroid-green"/> <img src="https://img.shields.io/badge/framework-react%20native-blue"/> <img src="https://img.shields.io/badge/language-typescript%20%7C%20swift%20%7C%20java-lightblue"/> 

<img src="https://github.com/muclipse/data-at-hand-mobile/blob/master/teaser_revised.jpg"/>

**Data@Hand** is a cross-platform smartphone app that facilitates visual data exploration leveraging both speech and touch interactions. Data visualization is a common way that mobile health apps enable people to explore their data on smartphones. However, due to smartphones’ limitations such as small screen size and lack of precise pointing input, they provide limited support for visual data exploration with over-simplified time navigation, even though *time* is a primary dimension of self-tracking data. Data@Hand leverages the synergy of speech and touch; speech-based interaction takes little screen space and natural language is flexible to cover different ways of specifying dates and their ranges (e.g., “October 7th”, “Last Sunday”, “This month”). Currently, Data@Hand supports displaying the **Fitbit** data (e.g., step count, heart rate, sleep, and weight) for navigation and temporal comparisons tasks.



### Related Research Paper (Describes the design and a user study)
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
