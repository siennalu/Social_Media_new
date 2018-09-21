const articleSchemaModel = require('../models/article_model.js');
const profileSchemaModel = require('../models/profile_model.js');
const uniqid = require('uniqid');
const formidable = require('formidable');
const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: 'dzzdz1kvr',
  api_key: '154653594993876',
  api_secret: 'pzNTrLGj6HJkE6QGAUeJ2cyBxAE'
})

module.exports = class Article {
  postArticle(req, res, next) {
    let contentForArray = [];
    let contentForObject = {};
    let photoObj = {};
    let videoObj = {};
    let seconds = Math.round(Date.now() / 1000);
    let article = new articleSchemaModel({
      listOfContent: [],
      delete: false
    });
    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      article.authorID = fields.authorID;
      article.author = fields.author;
      article.title = fields.title;
      article.category = fields.category;
      article.privacy = fields.privacy;
      contentForObject.time = seconds;
      contentForObject.content = fields.content;
      contentForArray.push(contentForObject);
      article.listOfContent = contentForArray;
      article.numberOfLikes = article.likes.length;
      article.hashTags = fields.hashTags;

      //上傳圖片及照片
      if (files.image != null && files.video != null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType; //png
          photoObj.link = resultPhotoUrl.secure_url;
          article.mediaLink.push(photoObj);

          cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
            videoObj.type = fields.videoType;
            videoObj.link = resultVideoUrl.secure_url;
            article.mediaLink.push(videoObj);

            profileSchemaModel.findOne({userID: fields.authorID})
              .then(data => {
                //console.log(data)
                //console.log("before" + article)
                article.avatarLink = data.avatarLink
                //console.log("after" + article)
              })
              .catch(error => res.json(error));


            article.save()
              .then(posts => {
                let result = {
                  status: "圖片和影片發文成功",
                  article: posts
                }
                res.json(result)
              })
              .catch(error => res.json(error));
          }, {resource_type: "video"});
        }, {folder: 'Social_Media/mediaLink'});

        //上傳圖片
      } else if (files.image != null && files.video == null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType; //png
          photoObj.link = resultPhotoUrl.secure_url;
          article.mediaLink.push(photoObj);

          profileSchemaModel.findOne({userID: fields.authorID})
            .then(data => {
              //console.log(data)
              //console.log("before" + article)
              article.avatarLink = data.avatarLink
              //console.log("after" + article)
            })
            .catch(error => res.json(error));
          article.save()
            .then(posts => {
              let result = {
                status: "圖片發文成功",
                article: posts
              }
              res.json(result)
            })
            .catch(error => res.json(error));
        }, {folder: 'Social_Media/mediaLink'});

        //上傳影片
      } else if (files.image == null && files.video != null) {
        cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
          videoObj.type = fields.videoType; //mp4
          videoObj.link = resultVideoUrl.secure_url;
          article.mediaLink.push(videoObj);

          profileSchemaModel.findOne({userID: fields.authorID})
            .then(data => {
              //console.log(data)
              //console.log("before" + article)
              article.avatarLink = data.avatarLink
              //console.log("after" + article)
            })
            .catch(error => res.json(error));
          article.save()
            .then(posts => {
              let result = {
                status: "影片發文成功",
                article: posts
              }
              res.json(result)
            })
            .catch(error => res.json(error));
        }, {resource_type: "video"});

      } else if (files.image == null && files.video == null) {
        profileSchemaModel.findOne({userID: fields.authorID})
          .then(data => {
            //console.log(data)
            //console.log("before" + article)
            article.avatarLink = data.avatarLink
            //console.log("after" + article)
          })
          .catch(error => res.json(error));

        article.save()
          .then(posts => {
            console.log("store to db")
            let result = {
              status: "發文成功",
              article: posts
            }
            res.json(result)
          })
          .catch(error => res.json(error));
      }
    })
  }

  async searchArticle(req, res, next) {
    let resultArray = [];
    let article = await articleSchemaModel.find({delete: false, privacy: "public"}).exec();
    //console.log(article)

    for (let i = 0; i <= article.length - 1; i++) {
      //console.log(article[i].authorID)
      profileSchemaModel.findOne({userID: article[i].authorID})
        .then(data => {
          //console.log(data)
          //console.log(article[i].avatarLink)
          article[i].avatarLink = data.avatarLink;
          //console.log("after"+ article[i].avatarLink)
          //console.log(article)
          article[i].save()
            .then(article => {
              console.log("avatar saved to db")
            })
            .catch(error => console.log(error));
        })
        .catch(error => console.log(error));
    }

    let sortedArticle = article.sort(function (b, a) {
      return a.listOfContent[a.listOfContent.length - 1].time - b.listOfContent[b.listOfContent.length - 1].time;
    });
    res.json(sortedArticle);
  }

  async searchArticleByArticleID(req, res, next) {
    let articleArray = []
    let articleOne = await articleSchemaModel.findOne({delete: false, _id: req.body.articleID, privacy: "public"}).exec()
    articleArray.push(articleOne);
    res.json(articleArray)
  }

  updateArticle(req, res, next) {
    let updateObj = {};
    let photoObj = {};
    let videoObj = {};
    let seconds = Math.round(Date.now() / 1000);
    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      updateObj.time = seconds;
      updateObj.content = fields.content;

      // 修改圖片和影片
      if (files.image != null && files.video != null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;
          cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
            videoObj.type = fields.videoType; //mp4
            videoObj.link = resultVideoUrl.secure_url;
            articleSchemaModel.findOne({_id: fields.articleID})
              .then(doc => {
                doc.listOfContent.push(updateObj);
                doc.mediaLink.push(photoObj);
                doc.mediaLink.push(videoObj);
                if (fields.privacy != null) doc.privacy = fields.privacy //文章權限
                doc.save()
                  .then(posts => {
                    let result = {
                      status: "圖片和影片修改成功",
                      article: posts
                    }
                    res.json(result)
                  })
                  .catch(error => res.json(error));
              })
              .catch(error => res.json(error));
          }, {resource_type: "video"});
        }, {folder: 'Social_Media/mediaLink'});

        //修改圖片
      } else if (files.image != null && files.video == null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;
          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              doc.listOfContent.push(updateObj);
              doc.mediaLink.push(photoObj);
              if (fields.privacy != null) doc.privacy = fields.privacy //文章權限
              doc.save()
                .then(posts => {
                  let result = {
                    status: "圖片修改成功",
                    article: posts
                  }
                  res.json(result)
                })
                .catch(error => res.json(error));
            })
            .catch(error => res.json(error));
        }, {folder: 'Social_Media/mediaLink'});

        //修改影片
      } else if (files.image == null && files.video != null) {
        cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
          videoObj.type = fields.videoType;
          videoObj.link = resultVideoUrl.secure_url;
          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              doc.listOfContent.push(updateObj);
              doc.mediaLink.push(videoObj);
              if (fields.privacy != null) doc.privacy = fields.privacy //文章權限
              doc.save()
                .then(posts => {
                  let result = {
                    status: "影片修改成功",
                    article: posts
                  }
                  res.json(result)
                })
                .catch(error => res.json(error));
            })
            .catch(error => res.json(error));
        }, {folder: 'Social_Media/mediaLink'});

        //修改文字
      } else if (files.image == null && files.video == null) {
        articleSchemaModel.findOne({_id: fields.articleID})
          .then(doc => {
            doc.listOfContent.push(updateObj);
            if (fields.privacy != null) doc.privacy = fields.privacy //文章權限
            doc.save()
              .then(value => {
                let result = {
                  status: "發文修改成功",
                  content: value
                }
                res.json(result);
              })
              .catch(error => res.json(error));
          })
      }
    })
  }


  deleteArticle(req, res, next) {
    articleSchemaModel.findOne({_id: req.body.articleID})
      .then(doc => {
        doc.delete = true;
        doc.save().then(value => {
          let result = {
            status: "刪除成功",
            content: value
          }
          res.json(result);
        })

          .catch(error => {
            let result = {
              status: "刪除失敗",
              err: "伺服器錯誤，請稍後再試"
            }
            res.json(error)
          })
      })
  }

  likesArticle(req, res, next) {
    articleSchemaModel.findOne({ _id: req.body.articleID})
      .then(doc => {
        doc.likes.push(req.body.likesPersonID);
        doc.numberOfLikes = doc.likes.length;
        doc.save().then(value => {
          let result = {
            status: "已按讚",
            content: value
          }
          res.json(result);
        })
          .catch(error => {
            let result = {
              status: "按讚失敗",
              err: "伺服器錯誤，請稍後再試"
            }
            res.json(error)
          })
      })
  }

  dislikesArticle(req, res, next) {
    articleSchemaModel.findOne({ _id: req.body.articleID})
      .then(doc => {
        let temp = doc.likes.indexOf(req.body.dislikesPersonID);
        doc.likes.splice(temp, 1);
        doc.numberOfLikes = doc.likes.length;
        doc.save().then(value => {
          let result = {
            status: "收回讚成功",
            content: value
          }
          res.json(result);
        })
          .catch(error => {
            let result = {
              status: "收回讚失敗",

              err: "伺服器錯誤，請稍後再試"
            }
            res.json(error)
          })
      })
  }

  commentArticle(req, res, next) {
    let commentArrayForListOfComment = [];
    let commentObjForListOfComment  = {};
    let forComment = {};
    let photoObj = {};
    let videoObj = {};
    let seconds = Math.round(Date.now() / 1000);

    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      let id = uniqid();
      forComment.id = id;
      commentObjForListOfComment.time = seconds;
      commentObjForListOfComment.content = fields.content;
      commentArrayForListOfComment.push(commentObjForListOfComment);
      forComment.listOfComment = commentArrayForListOfComment;
      forComment.commenterID = fields.commenterID
      forComment.mediaLink = [];
      forComment.likes = [];
      forComment.numberOfLikes = forComment.likes.length;
      forComment.delete = false;

      //留言圖片和影片
      if (files.image != null && files.video != null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;
          forComment.mediaLink.push(photoObj)

          cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
            videoObj.type = fields.videoType;
            videoObj.link = resultVideoUrl.secure_url;
            forComment.mediaLink.push(videoObj);

            profileSchemaModel.findOne({userID: fields.commenterID})
              .then(data => {
                forComment.commenter_avatarLink = data.avatarLink
              })
              .catch(error => res.json(error));

            articleSchemaModel.findOne({_id: fields.articleID})
              .then(doc => {
                doc.comment.push(forComment)
                //console.log(doc)
                let result = {
                  status: "圖片和影片留言成功",
                  article: doc
                }
                res.json(result)
              })
              .catch(error => res.json(error));
          }, {resource_type: "video"});
        }, {folder: 'Social_Media/mediaLink'});

        //留言圖片
      } else if (files.image != undefined && files.video == null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;
          forComment.mediaLink.push(photoObj)
          profileSchemaModel.findOne({userID: fields.commenterID})
            .then(data => {
              forComment.commenter_avatarLink = data.avatarLink
            })
            .catch(error => res.json(error));

          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              doc.comment.push(forComment)
              doc.save()
                .then(value => {
                  let result = {
                    status: "圖片留言成功",
                    article: value
                  }
                  res.json(result)
                })
                .catch(error => res.json(error));
            })
            .catch(error => res.json(error));
        }, {folder: 'Social_Media/mediaLink'});

        //留言影片
      }else if (files.image == null && files.video != null){
        cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
          videoObj.type = fields.videoType;
          videoObj.link = resultVideoUrl.secure_url;
          forComment.mediaLink.push(videoObj)

          profileSchemaModel.findOne({userID: fields.commenterID})
            .then(data => {
              forComment.commenter_avatarLink = data.avatarLink
            })
            .catch(error => res.json(error));
          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              doc.comment.push(forComment)
              doc.save()
                .then(value => {
                  let result = {
                    status: "影片留言成功",
                    article: value
                  }
                  res.json(result)
                })
                .catch(error => res.json(error));
            })
            .catch(error => res.json(error));
        }, {folder: 'Social_Media/mediaLink'});

        //只留言文字
      } else if (files.image == null && files.video == null) {
        profileSchemaModel.findOne({userID: fields.commenterID})
          .then(data => {
            forComment.commenter_avatarLink = data.avatarLink
          })
          .catch(error => res.json(error));

        articleSchemaModel.findOne({_id: fields.articleID})
          .then(doc => {
            doc.comment.push(forComment);
            doc.save()
              .then(value => {
                let result = {
                  status: "留言成功",
                  content: value
                }
                res.json(result);
              })
              .catch(error => {
                let result = {
                  status: "留言失敗",
                  err: "伺服器錯誤，請稍後再試"
                }
                res.json(error)
              })
          })
      }

    })
  }


  likesComment(req, res, next) {
    articleSchemaModel.findOne({_id: req.body.articleID})
      .then(doc => {
        for (let i = 0; i < doc.comment.length; i++) {
          if (doc.comment[i].id === req.body.commentID && doc.comment[i].likes.indexOf(req.body.likesPersonID) == -1)
            doc.comment[i].likes.push(req.body.likesPersonID);
          doc.comment.set(i, doc.comment[i])
        }
        doc.save()
          .then(value => {
            let result = {
              status: "留言成功",
              content: value
            }
            res.json(result);
          })
          .catch(error => {
            let result = {
              status: "留言失敗",
              err: "伺服器錯誤，請稍後再試"
            }
            res.json(error)
          })
      })
  }




}

