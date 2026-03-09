import { describe, expect, it } from 'bun:test'

import Http from '../src/core'

const http = new Http()

describe('get', () => {
  it('should perform a GET request and return the response', async () => {
    const response = await http.request('https://jsonplaceholder.typicode.com/posts/1')
    const data = await response.json()
    console.log(data)
    console.log(response)

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id', 1)
  })
})