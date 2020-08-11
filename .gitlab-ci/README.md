# GitLab CI Docker image

In case of an incompatible change increase the tag version number in build.sh!

```bash
./build.sh

# first time only
sudo docker login registry.gitlab.tugraz.at

sudo docker push registry.gitlab.tugraz.at/dbp/nextcloud/webapppassword/main:v1
```
