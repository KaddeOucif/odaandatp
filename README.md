
# Connecting your Conversational Interface to your Cloud Database
Conversational Interfaces has been on the rise the past couple of years with the technology showing more presence in our everyday life. During the last 2 years I&#39;ve been getting immersed in plenty of conversational projects, where one interesting pattern is that we tend to use conversational more frequently in the way we interact with businesses. A conversational project differs from the traditional way of developing applications since there&#39;s a lot to it before you start mapping out the architecture. This includes how you define your corpus, the appearance, what channel (voice or chat), what&#39;s the demography etc. There&#39;s a lot of good info on how we approach conversational at [bit.ly/ODAEnablement](https://fnimphiu.github.io/OracleTechExchange/). Nevertheless, setting up the integration to your systems backend usually has to do with a large part of the workload. In this article I show how you can expose, fetch and present data dynamically from an ATP (Autonomous Transaction Processing) database instance using natural language. ATP is a Cloud-based transactional database that&#39;s self-driving and requires no database administration. The hardware and software is not dependant on you installing it and it handles a bunch of operational tasks for you: such as patching, backing up data and scaling the database.ORDS (Oracle REST Data Services) has been around for a while and makes it possible for you to REST-enable your database schemas. With this approach, you can expose data that needs to be consumed by your applications seamlessly. Creating an ATP instance and enabling ORDS        3Retrieving data from ATP        10Querying ATP and displaying the result through cards created with the bots SDK        18Conclusion        24                                   Creating an ATP instance and enabling ORDS

![](images/0-oda-atp-lab-architecture.png)

# Creating the database
Let&#39;s start with you creating the ATP instance, which is your transactional database. When entering the Oracle Cloud Infrastructure (OCI)dashboard, you can either go the quick route and press the button that says **Create a database** or use the hamburger menu top-left **>** **Autonomous Transaction Processing**.

![](images/1-oci-landing-page.png)

Now choose the compartment in which you want to deploy the instance, give it a display & database name. We’re also going with the **Transaction Processing** as workload and **Serverless** as a deployment type. 

![](2-atp-instance-creation.png)
You can decide how much resources you need for the database (**1 CPU Core, 1 TB Storage** is set as a default). Choose **Transaction Processing**.

![](3-atp-instance-creation.png)

After you provided the administrator credentials, leave the license type as is and press the blue **Create Autonomous Database** button on your bottom left. 

![](4-atp-instance-creation.png)

You will now have to wait a couple of minutes for the database to provision. But don’t go away from the computer just yet – it took me roughly 2 minutes to get the instance up and running!

![](5-atp-instance-available.png)

When the instance is ready, it’s going to tell you that it is ![](6-atp-instance-available.png) in green. Now is the time to create the user and enabling ORDS.

figure 24: the engine understands **what** we want to do, but not **which** employee we would like to search for. as you can see, it asks us for a specific employee nameThen the bot will ask you what specific information you&#39;re looking for since it cannot find any entities it knows about. This is where our prompts come to use from the entities section.
# Working with the NLP data and creating cards through the backend
The **getEmployeeHireDate** component is a custom component in which we you retrieve send in two attributes; the entity match, received from the **resolveEmployee** state, and of course the ORDS **employees/** endpoint. the url to our ATP endpoint, just like the previous custom component. In this case however, we also send in the entity we retrieved from the **resolveEmployee** state in our **employee** stringvariable. We had a look at the component service in the previous section and we dissected the **GetTable.js** class or **getEmpTable** which is the custom component name. In the same folderGo back to your component folder. In there,,you can find there&#39;s another NodeJS class called **GetEmployeeHireDate.js** **(**which is ouror **getEmpHireDate** , which would be the custom component name)component. This class;
- receives **two** attributes in the metadata section; **ordsUrl** (which is our ORDS endpoint) and **employee (**which is the name of the employee we&#39;re searching for)
- has 2 supported actions; **next** and **error –** just like the previous component
- retrieves data by querying the ORDS service in our database
- loops through the data retrievedand uses the bots-node-sdk to build the responsive layout
-
This excerpt shows what it looks like when building the response items with the data received. Feel free to go through the code and alter it if need be. The sample code has some additional commentary in it that will help you understand it better.Then we have the first 2 lines, which are sent in and extracted from the metadata. **urlQuery** is a string that defines the ORDS query with the right employee name retrieved earlier. The rest are arrays that will be used for us to build the cards as well as a **text** variable that will be used for us to store a text object.  const { ordsUrl } =conversation.properties();  const { employee } =conversation.properties();  varurlQuery=&#39;?q={&quot;ename&quot;:{&quot;$like&quot;:&quot;%25&#39;+employee+&#39;%25&quot;}}&#39;;  varcardArr=newArray();  varactionArr=newArray();  vartext;Moving forward, we can see that the code is very similar to what we did in the previous component where the **request** module helps us do the necessary REST calls to our ATP endpoint. There&#39;s also some if-statement that simplifies debugging. The next step is then to loop through the JSON object retrieved by the ATP instance and create a card for each object. Let&#39;s dissect the code;    varbodyResponse=JSON.parse(body);     _//conversation.logger().info(&quot;Data received: \n&quot; + JSON.stringify(bodyResponse));_     _// Loops through the data retrieved from ATP_    for(variinbodyResponse.items){       _// Populating the variables with employee data_       varemployeeName=JSON.stringify(bodyResponse.items[i].ename).slice(1,-1);      varemployeeNumber=JSON.stringify(bodyResponse.items[i].empno);      varjob=JSON.stringify(bodyResponse.items[i].job).slice(1,-1);      varhireDate=JSON.stringify(bodyResponse.items[i].hiredate).slice(1,-11);       _// Pushing the right actions to our actions-array_      actionArr.push(MessageModel.callActionObject(&#39;Call&#39;,&#39;&#39;,&#39;+461234567&#39;));       _// Pushing the objects to our conversation_      cardArr.push(MessageModel.cardObject(          employeeName,          job+&#39;, &#39;+          employeeNumber+&#39;, &#39;+          hireDate,&#39;&#39;,&#39;&#39;,          actionArr        ));            _// Creating a textConversationMessage object_      text=MessageModel.textConversationMessage(          employee+&#39; who is a &#39;+          job+&#39; with the employee number &#39;+          employeeNumber+&#39; was hired &#39;+          hireDate+&#39;.&#39;        );    }
- The **for-loop** runs through the objects in the JSON array which is defined as bodyResponse.items. In this case we only have one employee each with a unique name, but you would imagine if we had multiple employees called Allen f.e.
- The variables in the beginning is where we store the attribute we need. The slice is used to format the data so we leave out unnecessary characters.
- Notice that we have a MessageModel object declared at the top using the @oracle/bots-node-sdk/lib We&#39;re using the SDK object called MessageModel to create the actions needed. In this case we only have **one** action defined which is a call label with a hardcoded phone number. This is pushed to our array of actions called
- For every employee in the array, we create a card using the MessageModel.cardObject function with the attributes we see fit. Then we push it to the cardArr array.
- MessageModel.textConversationMessage is just a showcase that we could create text objects using the MessageModel as well
When we&#39;re done creating the cards, the response objects are built that can be sent back to the ODA platform and we&#39;ll use the conversation.reply which executes the output for us.     varcardConvObj=MessageModel.cardConversationMessage(&#39;vertical&#39;,cardArr);    conversation.reply(cardConvObj);    conversation.reply(text);Feel free to go through the code and alter it if need be. The sample code has some additional commentary in it and there&#39;s links that will help you understand the ODA framework a bit better at the end of this article.ConclusionThis article shows how ORDS can make your databases accessible by ODA with the help of CRUD functions. It showcases how you In this article we managed to REST-enable our an ATP instance, retrieve data from it and also query our the database for specific data – all while leveraging the natural language processing in Oracles Digital Assistant.   | |
