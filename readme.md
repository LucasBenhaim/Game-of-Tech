## This template uses

- A dialogflow fulfillment environment.

## Steps for reproducing the project

2. [Create a Dialogflow project.](#dialogflow_project)

## <a name="dialogflow_project"></a> Create a Dialogflow project

1. Go to the [Dialogflow console.](https://dialogflow.cloud.google.com/)
2. Enter a name for your project and click "Create".
3. In the left menu, click "Fullfillment". Then, enable "Webhook".
4. Install ngrok, create an account and setup a domain in webhook (listening on port 3000 but you can change that).

## <a name="launch project"></a> NPM

1. Go at the root of the project and launch on the terminal"npm i", this will install a directory named node_modules with every modules.
2. After downloading every modules required, launch "npm start".

## <a name="test the project"></a> 

1. Go to dialogflow, in the agent section select export and import, unzip the .zip file in this github and import it.
2. On the right side of your screen there's a microphone and a text console, you can use it to try out the project, beware dialogflow needs to be in french, you can activate it in the languages section in the agent.