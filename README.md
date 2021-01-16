# Data@Hand

<img src="https://img.shields.io/badge/platform-ios%7Candroid-green"/> <img src="https://img.shields.io/badge/framework-react%20native-blue"/> <img src="https://img.shields.io/github/package-json/dependency-version/umdsquare/data-at-hand-mobile/react-native?label=React%20Native"/> <img src="https://img.shields.io/badge/language-typescript%20%7C%20swift%20%7C%20java-lightblue"/> <img src="https://img.shields.io/github/package-json/v/umdsquare/data-at-hand-mobile"/>

<img src="https://github.com/muclipse/data-at-hand-mobile/blob/master/teaser_revised.jpg"/>

**Data@Hand** is a cross-platform smartphone app that facilitates visual data exploration leveraging both speech and touch interactions. Data visualization is a common way that mobile health apps enable people to explore their data on smartphones. However, due to smartphones’ limitations such as small screen size and lack of precise pointing input, they provide limited support for visual data exploration with over-simplified time navigation, even though *time* is a primary dimension of self-tracking data. Data@Hand leverages the synergy of speech and touch; speech-based interaction takes little screen space and natural language is flexible to cover different ways of specifying dates and their ranges (e.g., “October 7th”, “Last Sunday”, “This month”). Currently, Data@Hand supports displaying the **Fitbit** data (e.g., step count, heart rate, sleep, and weight) for navigation and temporal comparisons tasks.

For more information about this project, please visit [https://data-at-hand.github.io](https://data-at-hand.github.io).


## Related Research Paper (Describes the design and a user study)
**Data@Hand: Fostering Visual Exploration of Personal Data on Smartphones Leveraging Speech and Touch Interaction**<br>
Young-Ho Kim, Bongshin Lee, Arjun Srinivasan, and Eun Kyoung Choe<br>
ACM CHI 2021 (conditionally accepted)


## How to build & run

### System Overview
Data@Hand is a stand-alone application that does not require a backend server. The app communicates with the Fitbit server and fetches the data locally on the device.

### Acquire Fitbit API Key
1. Register an app on the Fitbit developer page https://dev.fitbit.com/apps/new.
    1. Select **Client** for **OAuth 2.0 Application Type**.
    1. Use a URL similar to *edu.umd.hcil.data-at-hand://oauth2/redirect* for **Callback URL**. This URL will be used locally on your device.
    
1. Data@Hand leverages Fitbit's **Intraday API**, which you should explicitly get approval from Fitbit https://dev.fitbit.com/build/reference/web-api/intraday-requests/.
1. In the *credentials* directory in the repository, copy *fitbit.example.json* and rename it into *fitbit.json*.
1. Fill the information accordingly. You can get the information in **Manage My Apps** on the Fitbit developer page.
  ```js
  {
    "client_id": "YOUR_FITBIT_ID", // <- OAuth 2.0 Client ID 
    "client_secret": "YOUR_FITBIT_SECRET", // <- Client Secret
    "redirect_uri": "YOUR_REDIRECT_URI" // <- Callback URL
  }
  ```

### (Android Only) Acquire Microsoft Cognitive Speech API Key
1. Register a Microsoft Cognitive Speech-to-text service at a free-tier https://azure.microsoft.com/en-us/services/cognitive-services/speech-to-text/.
1. In the *credentials* directory in the repository, copy *microsoft_cognitive_service_speech.example.json* and rename it into *microsoft_cognitive_service_speech.json*.
1. Fill the information accordingly. You need a subscription ID and the region information.
  ```js
  {
    "subscriptionId": "YOUR_SUBSCRIPTION_ID",
    "region": "YOUR_AZURE_REGION" // <- Depending on the region you set. e.g., "eastus"
  }
  ```

### (Optional) If you want to track exceptions, register Bugsnag.
1. Create a Bugsnag project and get the **API Key** https://www.bugsnag.com/.
1. In the *credentials* directory in the repository, copy *bugsnag.example.json* and rename it into *bugsnag.json*.
1. Fill the information accordingly.
  ```js
  {
    "api_key": "YOUR_BUGSNAG_API_KEY"
  }
  ```

### Compile Data@Hand

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
