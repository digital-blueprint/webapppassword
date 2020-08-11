FROM debian:buster

ENV LANG C.UTF-8
ENV DEBIAN_FRONTEND noninteractive

# Basics
RUN apt-get update && apt-get install -y \
    php-zip \
    rsync \
    sudo \
    wget \
    curl \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# PHP Repo
RUN wget -O /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg
RUN echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list

# PHP 7.2
RUN apt-get update && apt-get install -y \
    php7.2 \
    php7.2-curl \
    php7.2-soap \
    php7.2-xml \
    php7.2-ldap \
    php7.2-zip \
    php7.2-gmp \
    php7.2-xdebug \
    php7.2-mbstring \
    && rm -rf /var/lib/apt/lists/*

# PHP 7.3
RUN apt-get update && apt-get install -y \
    php7.3 \
    php7.3-curl \
    php7.3-soap \
    php7.3-xml \
    php7.3-ldap \
    php7.3-zip \
    php7.3-gmp \
    php7.3-xdebug \
    php7.3-mbstring \
    && rm -rf /var/lib/apt/lists/*

# PHP 7.4
RUN apt-get update && apt-get install -y \
    php7.4 \
    php7.4-curl \
    php7.4-soap \
    php7.4-xml \
    php7.4-ldap \
    php7.4-zip \
    php7.4-gmp \
    php7.4-xdebug \
    php7.4-mbstring \
    && rm -rf /var/lib/apt/lists/*

# Default to PHP 7.3
RUN sudo update-alternatives --set php /usr/bin/php7.3
RUN sudo update-alternatives --set phar /usr/bin/phar7.3
RUN sudo update-alternatives --set phar.phar /usr/bin/phar.phar7.3

# Add a normal user and enable sudo
RUN useradd -u 1000 -ms /bin/bash user
RUN echo 'user ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
USER user
WORKDIR /home/user
