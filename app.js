const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
const isValid = require('date-fns/isValid')

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const hasPriorityAndCategoryProperties = requestQuery => {
  return
  requestQuery.priority !== undefined && requestQuery.category !== undefined
}

const hasCategoryAndStatusProperties = requestQuery => {
  return
  requestQuery.category !== undefined && requestQuery.status !== undefined
}

const hasPriorityAndStatusProperties = requestQuery => {
  return
  requestQuery.priority !== undefined && requestQuery.status !== undefined
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}

const outputResult = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

//API 1
app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''

  const {search_q = '', priority, category, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `
        SELECT *
        FROM todo
        WHERE priority = '${priority}' AND status = '${status}';`

          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasPriorityAndCategoryProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          category === 'WORK' ||
          category === 'HOME' ||
          category === 'LEARNING'
        ) {
          getTodosQuery = `
        SELECT * 
        FROM todo
        WHERE priority = '${priority}' AND category = '${category}';`

          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Category')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasCategoryAndStatusProperties(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `
        SELECT *
        FROM todo
        WHERE category = '${category}' AND  status = '${status}';`

          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodosQuery = `
      SELECT *
      FROM todo
      WHERE category = '${category}';`

        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodosQuery = `
      SELECT *
      FROM todo
      WHERE priority = '${priority}';`

        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodosQuery = `
      SELECT *
      FROM todo
      WHERE status = '${status}';`

        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`

      data = await db.all(getTodosQuery)
      response.send(data.map(eachItem => outputResult(eachItem)))

      break

    default:
      getTodosQuery = `SELECT * FROM todo;`
      data = await db.all(getTodosQuery)
      response.send(data.map(eachItem => outputResult(eachItem)))
  }
})

//API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
  SELECT *
  FROM todo
  WHERE id = ${todoId};`

  const todo = await db.get(getTodoQuery)
  response.send(outputResult(todo))
})

//API 3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  console.log(isMatch(date, 'yyyy-MM-dd'))

  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')

    console.log(newDate)

    const dateQuery = `
    SELECT * 
    FROM todo
    WHERE due_date = '${newDate}';`

    const responseQuery = await db.all(dateQuery)
    console.log(responseQuery)
    response.send(responseQuery.map(eachItem => outputResult(eachItem)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//API 4
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body

  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postNewDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const postTodoQuery = `
          INSERT INTO
          todo(id, todo, priority, status, category, due_date)
          VALUES (${id}, '${todo}', '${priority}', '${status}', '${category}', '${postNewDate}');`

          await db.run(postTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

//API 5
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const requestBody = request.body
  console.log(requestBody)

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`
  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    category = previousTodo.category,
    priority = previousTodo.priority,
    status = previousTodo.status,
    dueDate = previousTodo.dueDate,
  } = request.body

  let updateTodoQuery

  switch (true) {
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateTodoQuery = `
      UPDATE todo
      SET
      todo = '${todo}',
      category = '${category}',
      priority = '${priority}',
      status = '${status}',
      due_date = '${dueDate}'
      WHERE id = ${todoId};`

        await db.run(updateTodoQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        updateTodoQuery = `
      UPDATE todo
      SET
      todo = '${todo}',
      category = '${category}',
      priority = '${priority}',
      status = '${status}',
      due_date = '${dueDate}'
      WHERE id = ${todoId};`

        await db.run(updateTodoQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case requestBody.todo !== undefined:
      updateTodoQuery = `UPDATE todo
      SET
      todo = '${todo}',
      category = '${category}',
      priority = '${priority}',
      status = '${status}',
      due_date = '${dueDate}'
      WHERE id = ${todoId};`

      await db.run(updateTodoQuery)
      response.send('Todo Updated')

      break

    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateTodoQuery = `
      UPDATE todo
      SET
      todo = '${todo}',
      category = '${category}',
      priority = '${priority}',
      status = '${status}',
      due_date = '${dueDate}'
      WHERE id = ${todoId};`

        await db.run(updateTodoQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDueDate = format(new Date(dueDate, 'yyyy-MM-dd'))

        updateTodoQuery = `
      UPDATE todo
      SET
      todo = '${todo}',
      category = '${category}',
      priority = '${priority}',
      status = '${status}',
      due_date = '${newDueDate}'
      WHERE id = ${todoId};`

      await db.run(updateTodoQuery)
      response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

// API 6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM todo
  WHERE id = ${todoId};`

  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
