import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { backend_Url } from '../config';
import Loading from './Loading';

const BlogPost = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(`Fetching blog post with id: ${id}`);
    axios.get(`${backend_Url}/api/v1/post/post/${id}`, {
      headers: {
        Authorization: localStorage.getItem('token'),
      },
    })
      .then(response => {
        console.log('Response from server:', response.data);
        // Fetch comments for the blog post
        axios.get(`${backend_Url}/api/v1/post/post/${id}/comments`, {
          headers: {
            Authorization: localStorage.getItem('token'),
          },
        })
        .then(commentsResponse => {
          setBlog({
            ...response.data.post,
            comments: commentsResponse.data.comments,
          });
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching comments:', error);
          setLoading(false);
        });
      })
      .catch(error => {
        console.error('Error fetching blog post:', error);
        setLoading(false);
      });
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${backend_Url}/api/v1/post/post/${id}/comment`,
        { content: commentContent },
        {
          headers: {
            Authorization: localStorage.getItem('token'),
          },
        }
      );
      setCommentContent('');
      
      // Refetch comments to update the UI
      const commentsResponse = await axios.get(
        `${backend_Url}/api/v1/post/post/${id}/comments`,
        {
          headers: {
            Authorization: localStorage.getItem('token'),
          },
        }
      );
      setBlog(prevBlog => ({
        ...prevBlog,
        comments: commentsResponse.data.comments,
      }));
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  if (loading) {
    return <div className='flex justify-center mt-10'><Loading /></div>;
  }

  if (!blog) {
    return <div className="container mx-auto mt-10 p-5">Blog post not found</div>;
  }

  return (
    <div className="container mx-auto mt-10 p-5">
      <div className="blog-post max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <img src={blog.imageUrl} alt={blog.caption} className="w-full h-96 object-cover" />
        <div className="p-6 content">
          <h1 className="text-3xl font-bold text-gray-800">{blog.caption}</h1>
          <p className="text-sm text-gray-600">by {blog.author} on {new Date(blog.date).toLocaleDateString()}</p>
          <div className="mt-4 text-gray-700 leading-relaxed">{blog.content}</div>
        </div>
        <div className="p-6 border-t border-gray-100 comments">
          <h2 className="text-xl font-semibold text-gray-800">Leave a comment</h2>
          <form className="mt-4" onSubmit={handleCommentSubmit}>
            <textarea
              className="w-full h-32 text-black p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your comment here..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
            ></textarea>
            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Submit
            </button>
          </form>

          <h2 className="text-xl font-semibold text-gray-800 mt-6">Comments</h2>
          {blog.comments && blog.comments.map(comment => (
            <div key={comment.id} className="mt-4 border-b border-gray-200 pb-4 flex items-start">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold mr-3">
                {comment.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-800">{comment.user.name}</h4>
                <p className="text-gray-700">{comment.content}</p>
                <p className="text-sm text-gray-600">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BlogPost;