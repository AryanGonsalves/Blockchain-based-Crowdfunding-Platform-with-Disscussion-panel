import { useState, useEffect, useCallback } from 'react'
import { DateTime } from 'luxon'
import { getChildComments, generateAvatar } from '../utils/utils.js'
import Comment from '../model/comment.js'
import useWebSocket from '../webSocketHook.js'

function Discussion() {
  const [error, setError] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [comments, setComments] = useState([])
  // To keep which comment is being replied and making related create comment view visible
  const [commentReplyStatuses, setCommentReplyStatuses] = useState({})
  // To keep input values in create comment views,
  // for both new (the key will be null) and reply (the key will be comment.id)
  const [inputValues, setInputValues] = useState({})
  // To keep initial random avatars for new comments,
  // for both new (the key will be null) and reply (the key will be commit.id)
  const [avatarsForNewComments, setAvatarsForNewComments] = useState({})

  // Use webSocketHook
  const ws = useWebSocket({ socketUrl: 'ws://localhost:3000' })

  // Fetch comments and display them in screen
  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/comments')
      
      if (response.ok) {
        const data = await response.json()
        
        console.log(data)
        const comments = data.comments
        
        // Iterate over comments and replace commentDate strings with Luxon DateTime objects; they will be necessary
        comments.forEach(comment => {
          comment.commentDate = DateTime.fromISO(comment.commentDate)
        })
        // Sort comments by their commentDate attributes
        comments.sort((a, b) => b.commentDate - a.commentDate)

        // Initialize input values on create comment views so inputs becomes controlled components
        const inputValues = { null: '' }
        comments.filter(comment => comment.parentCommentId === null).forEach(comment => {
          inputValues[comment.id] = ''
        })
        setInputValues(inputValues)

        // Initialize avatars for new comments
        const avatars = { null: generateAvatar() }
        comments.filter(comment => comment.parentCommentId === null).forEach(comment => {
          avatars[comment.id] = generateAvatar()
        })
        setAvatarsForNewComments(avatars)

        setIsLoaded(true)
        setComments(comments)
      } else {
        throw Error(`${response.statusText} Error message: ${await response.text()}`)
      }
    } catch (e) {
      setIsLoaded(true)
      setError(e)
      console.log(e)
    }
  }, [])

  /*
   * Create a root comment (if comment param is not given) or a nested comment (if comment param is given)
   */
  const createComment = async comment => {
    let commentFromClass = null
    if (!comment) {
      // Create a root comment
      const commentInputValue = inputValues[null]
      commentFromClass = new Comment({
        avatar: avatarsForNewComments[null],
        commentText: commentInputValue
      })
    } else {
      // Create a nested comment
      const commentId = comment.id
      const commentInputValue = inputValues[commentId]
      commentFromClass = new Comment({
        avatar: avatarsForNewComments[commentId],
        commentText: commentInputValue,
        parentCommentId: commentId
      })

      // Hide the input at the end
      setCommentReplyStatuses({ ...commentReplyStatuses, ...({ [commentId]: false }) })
    }

    try {
      const response = await fetch('http://localhost:3000/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: {
            username: commentFromClass.username,
            avatar: commentFromClass.avatar,
            commentDate: commentFromClass.commentDate,
            commentText: commentFromClass.commentText,
            upvotes: commentFromClass.upvotes,
            parentCommentId: commentFromClass.parentCommentId
          }
        })
      })

      if (response.ok) {
        fetchComments()
      } else {
        throw Error(`${response.statusText} Error message: ${await response.text()}`)
      }
    } catch (e) {
      console.log(e)
    }
  }

  /*
   *Update this comment by increasing its upvotes attribute by one
   */
  const upvoteComment = async comment => {
    const commentId = comment.id
    const upvotesValue = comment.upvotes
    try {
      const response = await fetch(`/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: {
            upvotes: upvotesValue + 1
          }
        })
      })

      if (response.ok) {
        fetchComments()
      } else {
        throw Error(`${response.statusText} Error message: ${await response.text()}`)
      }
    } catch (e) {
      console.log(e)
    }
  }

  /*
   * Add a create comment fragment below this comment to provide user a way to reply to this comment
   */
  const replyComment = comment => {
    const commentId = comment.id
    setCommentReplyStatuses({ ...commentReplyStatuses, ...({ [commentId]: true }) })
  }

  useEffect(() => {
    // If there is an incoming message via websocket,
    // it means that there is some update and therefore the UI should be updated
    if (ws.data) {
      const { message } = ws.data
      console.log(message)
      fetchComments()
    }
  }, [ws.data, fetchComments])

  if (error) {
    return <div>Error: {error.message}</div>
  } else if (!isLoaded) {
    return <div>Loading...</div>
  } else {
    return (
      <div className="container w-1/2 mx-auto my-4 space-y-4">
        <h1 className="text-3xl font-bold">Discussion Forum</h1>

        <p>
          <h2>Please follow the rules listed below and respect all other users</h2>
        </p>
        <p>
          Avoid discussing personal information.<bl/>
          Avoid discussing political or sensitive information.<bl/>
          Engage with all users in a friendly manner.<bl/>
          If users do not follow these rules, they will be banned.<bl/>
        </p>
        <p>
        <bl/><bl/><bl/>
        </p>
        <p>
          Purpose of the Discussion Forum<bl/>
          The main purpose of this Discussion Forum is to reach out to other users and discuss about created crowdfunding projects.<bl/>
          Users can discuss about various projects, their interests and fundings, project progress, and can also anonymously suggest changes and improvements to current project plans and ideas.
        </p>

        {/* Discussion component */}
        <div>
          <h2 className="text-2xl font-bold">Discussion</h2>
          {/* New comment */}
          <div id="new-comment" className="mt-8 flex gap-x-3">
            <img id="new-commenter-image" src={avatarsForNewComments[null]} alt="Avatar" className="inline w-8 h-8"/>
            <input
              type="text"
              id="comment"
              name="comment"
              placeholder="What are your thoughts?"
              required
              className="
                grow
                px-2
                placeholder:text-xs
                border-2
                rounded
                focus:outline-none
                focus:border-2
                focus:border-purple-500
              "
              minLength="10"
              maxLength="255"
              value={inputValues[null]}
              onChange={event => setInputValues({ ...inputValues, ...({ null: event.target.value }) })}
            />
            <button
              id="create-comment"
              className="
                bg-purple-700
                text-sm
                text-white
                px-4
                py-1
                rounded
                hover:bg-purple-800
                active:bg-purple-900
                focus:outline-none
                focus:ring
                focus:ring-purple-500
              "
              onClick={() => { createComment() }}
            >
              Comment
            </button>
          </div>

          <hr className="my-10"/>

          {/* Comments */}
          <ul id="comments">
            {
              // Display root comments
              comments.filter(comment => comment.parentCommentId === null).map(comment => (
                <li key={comment.id} className="flex gap-x-3 mt-8">
                  <div className="flex-none flex flex-col">
                    <img src={comment.avatar} alt="Avatar" className="w-8 h-8"/>
                    <div
                      className={
                        `h-full ml-4 border-l-2 ${getChildComments(comment, comments).length === 0 ? 'hidden' : ''}`
                      }
                    >
                    </div>
                  </div>
                  <div className="grow">
                    <div className="flex gap-x-3">
                      {/* User name */}
                      <div className="font-medium">{comment.username}</div>
                      {/* Separator */}
                      <div>&middot;</div>
                      {/* Time */}
                      <div className="text-sm my-auto text-slate-400">
                        {comment.commentDate.toRelative({ style: 'narrow' })}
                      </div>
                    </div>
                    <div>
                      {/* Comment */}
                      <div>
                        {comment.commentText}
                      </div>
                    </div>
                    <div className="mt-3 font-medium text-sm text-slate-500">
                      {/* Upvote button */}
                     {/*  <button comment-id={comment.id} className="upvotes" onClick={() => { upvoteComment(comment) }}>
                        &#9650; Upvote
                      </button>
                      &nbsp; */}
                      {/* Upvote count */}
                      {/* <span comment-id={comment.id} className="upvotes view">{comment.upvotes}</span> */}
                      {/* Reply button */}
                      <button comment-id={comment.id} className="ml-8 reply" onClick={() => { replyComment(comment) }}>
                        Reply
                      </button>
                    </div>
                    {/* Sub-comments */}
                    <ul>
                      <li
                        comment-id={comment.id}
                        className={
                          `new-comment nested mt-8 gap-x-3 ${commentReplyStatuses[comment.id] ? 'flex' : 'hidden'}`
                        }
                      >
                        <img
                          src={avatarsForNewComments[comment.id]}
                          alt="Avatar"
                          className="commenter new inline w-8 h-8"
                        />
                        <input
                          type="text"
                          name="comment"
                          placeholder="What are your thoughts?"
                          required
                          className="
                            comment
                            grow
                            px-2
                            placeholder:text-xs
                            border-2
                            rounded
                            focus:outline-none
                            focus:border-2
                            focus:border-purple-500
                          "
                          minLength="10"
                          maxLength="255"
                          value={inputValues[comment.id]}
                          onChange={
                            event => setInputValues({ ...inputValues, ...({ [comment.id]: event.target.value }) })
                          }
                        />
                        <button
                          className="
                            create-comment
                            bg-purple-700
                            text-sm
                            text-white
                            px-4
                            py-1
                            rounded
                            hover:bg-purple-800
                            active:bg-purple-900
                            focus:outline-none
                            focus:ring
                            focus:ring-purple-500
                          "
                          onClick={() => { createComment(comment) }}
                        >
                          Comment
                        </button>
                      </li>
                      {
                        getChildComments(comment, comments).map(comment => (
                          <li key={comment.id} className="flex gap-x-3 mt-8">
                            <div className="flex-none flex flex-col">
                              <img src={comment.avatar} alt="Avatar" className="w-8 h-8"/>
                            </div>
                            <div className="grow">
                              <div className="flex gap-x-3">
                                {/* User name */}
                                <div className="font-medium">{comment.username}</div>
                                {/* Separator */}
                                <div>&middot;</div>
                                {/* Time */}
                                <div className="text-sm my-auto text-slate-400">
                                  {comment.commentDate.toRelative({ style: 'narrow' })}
                                </div>
                              </div>
                              <div>
                                {/* Comment */}
                                <div>
                                  {comment.commentText}
                                </div>
                              </div>
                              <div className="mt-3 font-medium text-sm text-slate-500">
                                {/* Upvote button */}
                                {/* <button
                                  comment-id={comment.id}
                                  className="upvotes"
                                  onClick={() => { upvoteComment(comment) }}
                                >
                                  &#9650; Upvote
                                </button> */}
                                &nbsp;
                                {/* Upvote count */}
                               {/*  <span comment-id={comment.id} className="upvotes view">{comment.upvotes}</span> */}
                              </div>
                            </div>
                          </li>
                        ))
                      }
                    </ul>
                  </div>
                </li>
              ))
            }
          </ul>
        </div>
      </div>
    );
  }
}

export default Discussion;
