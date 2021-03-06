const Student = require("./../Models/studentModel");
const Subject = require("./../Models/subjectModel");

// We construct an instance of PubSub to handle the subscription topics for our application using PubSub from graphql-subscriptions
const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();

const STUDENT_ADDED_TOPIC = "newStudent";
const SUBJECT_ADDED_TOPIC = "newSubject";

module.exports = {
  Query: {
    Student: id => {
      return Student.findOne({ id: id }, (err, docs) => {
        if (err) {
          console.log(err);
        }
        return docs;
      });
    },
    allStudents: () => {
      return Student.find((err, docs) => {
        if (err) {
          console.log(err);
        }
        return docs;
      });
    },
    Subject: id => {
      return Subject.findOne({ id: id }, (err, docs) => {
        if (err) {
          console.log(err);
        }
        return docs;
      });
    },
    allSubjects: () => {
      return Subject.find({}, (err, docs) => {
        if (err) {
          console.log(err);
        }
        return docs;
      });
    }
  },

  Mutation: {
    addStudent: (root, args) => {
      const newStudent = {
        id: args.id,
        name: args.name,
        subjects: args.subjects
      };
      return Student.create(newStudent, (err, docs) => {
        if (err) {
          console.log(err);
        }
        // Publish the new student to the newStudent topic; it will then be received by clients that are subscribed to this topic
        pubsub.publish(STUDENT_ADDED_TOPIC, { studentAdded: docs });
        return new Promise((resolve, reject) => {
          resolve(docs);
        });
      });
    },
    addSubject: (root, args) => {
      const newSubject = {
        id: args.id,
        name: args.name,
        professor: args.professor,
        students: args.students
      };
      return Subject.create(newSubject, (err, docs) => {
        if (err) {
          console.log(err);
        }
        pubsub.publish(SUBJECT_ADDED_TOPIC, { subjectAdded: docs });
        return new Promise((resolve, reject) => {
          resolve(docs);
        });
      });
    }
  },

  Subscription: {
    // the value is an object, not a function as with queries and mutations
    // object has a subscribe key, whose value is the resolver method
    // the "subscribe" resolver must return an AsyncIterator
    // An async iterator is much like an iterator, except that its next() method returns a promise for a { value, done } pair
    // More on iterators: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators
    // we are using the asyncIterator provided by the PubSub instance
    studentAdded: {
      subscribe: () => pubsub.asyncIterator(STUDENT_ADDED_TOPIC)
    },
    subjectAdded: {
      subscribe: () => pubsub.asyncIterator(SUBJECT_ADDED_TOPIC)
    }
  }
};
