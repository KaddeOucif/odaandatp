'use strict';
const request = require('request');
const { MessageModel } = require('@oracle/bots-node-sdk/lib');

module.exports = {
  metadata: () => ({
    name: 'getEmpHireDate',
    properties: {
      ordsUrl: { required: true, type: 'string' },
      employee: { required: true, type: 'string' }
    },
    supportedActions: ['next', 'error']
  }),
  invoke: (conversation, done) => {
  
  // Values retrieved from ODA which we extract from the properties section
  const { ordsUrl } = conversation.properties();
  const { employee } = conversation.properties();

  // This is where we format the query used towards the ORDS endpoint. This is based on the employee value we retrieve from ODA.
  var urlQuery = '?q={"ename":{"$like":"%25' + employee + '%25"}}';

  // Defining the variables in which we will store the data for our response items
  var cardArr = new Array();
  var actionArr = new Array();
  var text;

  //conversation.logger().info('URL: ' + ordsUrl + urlQuery);
  //conversation.logger().info('Employee: ' + employee);

  request({
    followAllRedirects: true,
    url: ordsUrl + urlQuery,
    method: "GET",
    headers: {
      'Content-Type': 'application/json'
    }
  }, function (error, response, body){
    if (error) { 
      conversation.logger().info("Error: " + error); 
      conversation.transition('error'); 
    }
    
    var bodyResponse = JSON.parse(body);

    //conversation.logger().info("Data received: \n" + JSON.stringify(bodyResponse));

    // Loops through the JSON we got as a response from doing our REST call to the ATP ORDS endpoint
    for (var i in bodyResponse.items) {

      // Here we make sure we popoulate our variables with the right values retrieved from the database
      var employeeName = JSON.stringify(bodyResponse.items[i].ename).slice(1, -1);
      var employeeNumber = JSON.stringify(bodyResponse.items[i].empno);
      var job = JSON.stringify(bodyResponse.items[i].job).slice(1, -1);
      var hireDate = JSON.stringify(bodyResponse.items[i].hiredate).slice(1, -11);

      // Pushing the right actions to our actions-array
      actionArr.push(MessageModel.callActionObject('Call', '', '+461234567'));

      // Pushing the objects to our conversation
      cardArr.push(MessageModel.cardObject (
          employeeName, 
          job + ', ' + 
          employeeNumber + ', ' + 
          hireDate, '', '', 
          actionArr
        ));
      
      // Creating a textConversationMessage object
      text = MessageModel.textConversationMessage (
          employee + ' who is a ' + 
          job + ' with the employee number ' + 
          employeeNumber + ' was hired ' + 
          hireDate + '.'
        );
    }

    /** 
     * Here we build the response objects using our cardArr, sets the carousel to vertical and send it to ODA which sends it to the end-user. 
     * We do the same thing with the text-object created earlier. When this is done, the component moves to the action called "next"
     * which is mapped to another state in the flow. 
    */
    var cardConvObj = MessageModel.cardConversationMessage('vertical', cardArr);
    conversation.reply(cardConvObj);
    conversation.reply(text);
    conversation.transition('next');
    done();
    });
  }
};
