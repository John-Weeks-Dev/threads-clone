import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    console.log(body)
    
    const res = await prisma.posts.create({
        data: {
            userId: body.userId,
            name: body.name,
            image: body.image,
            text: body.text,
            picture: body.picture,
        }
    })

    return res
})