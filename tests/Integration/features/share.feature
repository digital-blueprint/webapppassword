# SPDX-FileCopyrightText: 2025 Webapppassword contributors
# SPDX-License-Identifier: AGPL-3.0-or-later

Feature: share
  Scenario: User jane sees all her shares from known origin
    When user "jane" comes from "https://known-site.com"
    Then user "jane" sees shares
  Scenario: User jane does not see all her shares from unknown origin
    When user "jane" comes from "https://unknown-site.com"
    Then user "jane" cannot see shares
  Scenario: Anonymous user cannot see shares
    Then Not logged user cannot see shares
  Scenario: Create a share and see share from known origin
    When user "jane" comes from "https://known-site.com"
    Then user "jane" creates share "/welcome.txt"
    Then user "jane" sees recently shared item
  Scenario: Create a share from known origin but see share from unknown origin
    When user "jane" comes from "https://known-site.com"
    Then user "jane" creates share "/welcome.txt"
    When user "jane" comes from "https://unknown-site.com"
    Then user "jane" cannot see recently shared item
  Scenario: Cannot create a share from unknown origin
    When user "jane" comes from "https://unknown-site.com"
    Then user "jane" can not create share "/welcome.txt"
  Scenario: User jane sees share from known origin
    When user "jane" comes from "https://known-site.com"
    Then user "jane" sees shares related to path "/welcome.txt"

