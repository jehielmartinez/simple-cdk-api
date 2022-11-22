import { Handler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const tableName = process.env.TABLE_NAME;
const dynamo = new DynamoDB();

export const handler: Handler = async (event, context) => {
  const method = event.requestContext.http.method;
  try {
    if (method === "POST") {
      const body = JSON.parse(event.body);
      return saveStudent(body as Student);
    } else if (method === "GET") {
      const studentId = event.queryStringParameters.id;
      return getStudent(studentId);
    } else if (method === "DELETE") {
      const studentId = event.queryStringParameters.id;
      return deleteStudent(studentId);
    } else {
      throw new Error("Method not allowed");
    }
  } catch (error: any) {
    return {
      statusCode: 500,
      body: error.message,
    };
  }
};

const saveStudent = async (student: Student) => {
  const params: DynamoDB.DocumentClient.PutItemInput = {
    TableName: tableName!,
    Item: {
      id: {
        S: student.id,
      },
      firstName: {
        S: student.firstName,
      },
      lastName: {
        S: student.lastName,
      },
      email: {
        S: student.email,
      },
    },
  };
  await dynamo.putItem(params).promise();
  return {
    statusCode: 201,
    body: JSON.stringify(student),
  };
};

const getStudent = async (studentId: string) => {
  if (!studentId || studentId.length === 0) {
    throw new Error("studentId not defined");
  }
  const params: DynamoDB.DocumentClient.GetItemInput = {
    TableName: tableName!,
    Key: {
      id: {
        S: studentId,
      },
    },
  };
  const item = await dynamo.getItem(params).promise();
  if (item.$response.error) {
    throw new Error(item.$response.error.message);
  }
  const { id, firstName, lastName, email } = item.Item!;
  return {
    statusCode: 200,
    body: JSON.stringify({
      id: id.S,
      firstName: firstName.S,
      lastName: lastName.S,
      email: email.S,
    }),
  };
};

const deleteStudent = async (studentId: string) => {
  if (!studentId || studentId.length === 0) {
    throw new Error("studentId not defined");
  }
  const params: DynamoDB.DocumentClient.DeleteItemInput = {
    TableName: tableName!,
    Key: {
      id: {
        S: studentId,
      },
    },
  };
  const item = await dynamo.deleteItem(params).promise();
  if (item.$response.error) {
    throw new Error(item.$response.error.message);
  }
  return {
    statusCode: 204,
    body: 'Student deleted',
  };
};
