# external-dannyshihnet-status-check
External status check for dannyshih.net services

## Run
https://hub.docker.com/repository/docker/dannyshih/external-dannyshihnet-status-check
- The container expects a `slack-token.txt` file in its working directory.
- By default, a slack message is only sent if there are errors. To override this, e.g. for a daily status check, set the `ALWAYS_NOTIFY` environment variable.

```
docker run --rm --volume="<slack-token.txt>:/home/node/app/slack-token.txt" --env "ALWAYS_NOTIFY=true" dannyshih/external-dannyshihnet-status-check:<version>
```
