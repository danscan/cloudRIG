exports.handler = (event, context, callback) => {

    var common = require("cloudrigLambdaCommon");
    var AWS = require("aws-sdk");
    var ec2 = new AWS.EC2();
    var sns = new AWS.SNS();
    var cloudwatchevents = new AWS.CloudWatchEvents();


    var eventBody = JSON.parse(event.Records[0].Sns.Message);
    var lambdaARNQueue = eventBody.lambdaARNQueue;


    function run() {
        common.report("Finding Parsec AMI");

        ec2.describeImages(
            {
                Filters: [
                    {
                        Name: "name",
                        Values: [config.AWSInstanceType === "g2.2xlarge" ? "parsec-g2-ws2016-14" : "parsec-g3-*"]
                        // TODO: currently hardcoded to old version of g2 AMI due to issue with latest ver
                    }
                ]
            },
            (err, data) => {
                if (err) {
                    common.report(err);
                    return;
                }

                if (!eventBody.state) {
                    eventBody.state = {};
                }

                if (data.Images[0]) {
                    eventBody.state.ImageId = data.Images[0].ImageId;

                    common.report("Parsec AMI found");
                    triggerNextLambda();
                }
                else {
                    common.report("Parsec AMI not found");
                }

            }
        );
    }

    cloudwatchevents.disableRule({ Name: "ScheduleLambda" },
        function (err, data) {
            if (err) {
                common.report(err);
            }

            run();
        });



}