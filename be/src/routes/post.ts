import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { verify } from 'hono/jwt'

export const postRouter = new Hono<{
  Bindings : {
    DATABASE_URL : string
    JWT_SECRET : string
  },
  Variables : {
    userId : string
  }
}>()


postRouter.use('/*',async(c,next)=>{
	const authHeader =  c.req.header("authorization") || ""
	const user =  await verify(authHeader,c.env.JWT_SECRET)

	if(user){
		c.set("userId",user.id);
		 await next()
	}else{
		c.status(411)
	 return c.json({
			msg : "something went wrong"
		})
}
})


postRouter.post('/post',async(c)=>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    
    const userId = c.get("userId")
    const body = await c.req.json()
const user = await prisma.post.create({
    data : {
        caption : body.caption,
        imageUrl : body.imageUrl,
        personId : Number(userId)
    }
})

  return c.json({
    id : user.id
  })
})

postRouter.put('/update',async(c)=>{
    const body = await c.req.json()
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
}).$extends(withAccelerate())
const user = await prisma.post.update({
    where : {
        id : body.id
    },
    data : {
        caption : body.caption,
    }
})
  return c.json({
    id : user.id
  })
})

postRouter.get('/bulk', async(c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
}).$extends(withAccelerate())

const posts = await  prisma.post.findMany()

return c.json({
    posts
})
})

postRouter.get('/post/:id', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const id = parseInt(c.req.param('id'), 10);
  
  const post = await prisma.post.findUnique({
    where: { id: id },
  });

  if (!post) {
    c.status(404);
    return c.json({ msg: "Post not found" });
  }

  return c.json({ post });
});


postRouter.delete('/delete', async (c) => {
  // Authorization check can be reused from existing middleware
  const authHeader = c.req.header("authorization") || "";
  const user = await verify(authHeader, c.env.JWT_SECRET);

  if (!user) {
    c.status(401); // Unauthorized
    return c.json({ msg: "Authorization required" });
  }

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  // Delete all posts (consider adding confirmation prompt for safety)
  await prisma.post.deleteMany({});

  // Respond with success message
  return c.json({ msg: "All posts deleted successfully" });
});

postRouter.get('/name/:id', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const id = parseInt(c.req.param('id'), 10);

  const user = await prisma.user.findUnique({
    where: { id }, // Filter by ID
    select: { name: true }, // Only retrieve the "name" field
  });

  if (!user) {
    return c.status(404)
  }

  return c.json({ name: user.name }); 
});


postRouter.post('/post/:postId/comment', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

  const userId = c.get("userId")
  const postId = parseInt(c.req.param('postId'), 10)
  const body = await c.req.json()

  const comment = await prisma.comment.create({
    data: {
      content: body.content,
      postId: postId,
      userId: Number(userId),
    },
  })

  return c.json({
    id: comment.id,
  })
})

postRouter.get('/post/:postId/comments', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

  const postId = parseInt(c.req.param('postId'), 10)

  const comments = await prisma.comment.findMany({
    where: {
      postId: postId,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  })

  return c.json({
    comments,
  })
})

postRouter.delete('/comment/:id', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

  const commentId = parseInt(c.req.param('id'), 10)

  await prisma.comment.delete({
    where: {
      id: commentId,
    },
  })

  return c.json({
    msg: "Comment deleted successfully",
  })
})

