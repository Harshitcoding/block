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
postRouter.delete('/posts/delete-all', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Delete all comments
    const deletedComments = await prisma.comment.deleteMany();

    // Delete all posts
    const deletedPosts = await prisma.post.deleteMany();

    return c.json({
      msg: "All posts and comments deleted successfully",
      deletedComments: deletedComments.count,
      deletedPosts: deletedPosts.count,
    });
  } catch (error) {
    console.error("Error deleting posts and comments:", error);
    c.status(500);
    return c.json({
      msg: "An error occurred while deleting posts and comments",
      error: error.message,
    });
  }
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

