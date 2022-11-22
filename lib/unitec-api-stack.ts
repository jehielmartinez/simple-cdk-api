import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { CorsHttpMethod, HttpApi } from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

export class UnitecApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Database to save students
    const studentTable = new Table(this, "Students-Table", {
      tableName: "students",
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: { name: "id", type: AttributeType.STRING },
    });

    // Lambda function to handle the CRUD logic
    const studentCrudLambda = new NodejsFunction(this, "Students-Crud-Lambda", {
      functionName: "StudentsCRUD",
      runtime: Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "./../lambdas/studentCrud.ts"),
      handler: "handler",
      environment: {
        TABLE_NAME: studentTable.tableName,
      },
    });

    studentTable.grantReadWriteData(studentCrudLambda);

    // Api gateway
    const studentApi = new HttpApi(this, "Students-Api", {
      apiName: "StudentsApi",
      corsPreflight: {
        allowHeaders: ["Content-Type"],
        allowMethods: [CorsHttpMethod.ANY],
        allowOrigins: ["*"],
      },
    });
    studentApi.addRoutes({
      path: "/student",
      integration: new HttpLambdaIntegration(
        "Students-Crud-Integration",
        studentCrudLambda
      ),
    });
    new CfnOutput(this, "Students-Api-URL", {
      value: studentApi.apiEndpoint,
    });
  }
}
