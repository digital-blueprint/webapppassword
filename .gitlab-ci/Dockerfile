FROM debian:bullseye

ENV LANG C.UTF-8
ENV DEBIAN_FRONTEND noninteractive

# Basics
RUN apt-get update && apt-get install -y \
    php-zip \
    rsync \
    sudo \
    wget \
    git \
    make \
    curl \
    lsb-release

# PHP Repo
RUN wget -O /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg
RUN echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list

# PHP 7.2
RUN apt-get update && apt-get install -y \
    php7.2 \
    php7.2-curl \
    php7.2-soap \
    php7.2-xml \
    php7.2-gd \
    php7.2-zip \
    php7.2-gmp \
    php7.2-sqlite3 \
    php7.2-mbstring

# PHP 7.3
RUN apt-get install -y \
    php7.3 \
    php7.3-curl \
    php7.3-soap \
    php7.3-xml \
    php7.3-gd \
    php7.3-zip \
    php7.3-gmp \
    php7.3-sqlite3 \
    php7.3-mbstring

# PHP 7.4
RUN apt-get install -y \
    php7.4 \
    php7.4-curl \
    php7.4-soap \
    php7.4-xml \
    php7.4-gd \
    php7.4-zip \
    php7.4-gmp \
    php7.4-sqlite3 \
    php7.4-mbstring \
    && rm -rf /var/lib/apt/lists/*

# Default to PHP 7.4
RUN sudo update-alternatives --set php /usr/bin/php7.4
RUN sudo update-alternatives --set phar /usr/bin/phar7.4
RUN sudo update-alternatives --set phar.phar /usr/bin/phar.phar7.4

# Install composer
RUN cd /tmp && \
    php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" && \
    php -r "if (hash_file('sha384', 'composer-setup.php') === '55ce33d7678c5a611085589f1f3ddf8b3c52d662cd01d4ba75c0ee0459970c2200a51f492d557530c71c15d8dba01eae') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;" && \
    php composer-setup.php && \
    php -r "unlink('composer-setup.php');" && \
    sudo mv composer.phar /usr/local/bin/composer

# Add a normal user and enable sudo
RUN useradd -u 1000 -ms /bin/bash user
RUN echo 'user ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
USER user
WORKDIR /home/user
