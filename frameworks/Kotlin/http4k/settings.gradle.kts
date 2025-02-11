pluginManagement {
    repositories {
        mavenCentral()
        gradlePluginPortal()
    }
}

rootProject.name = "http4k-benchmark"
include("core")
include("core-jdbc")
include("core-pgclient")
include("apache")
include("apache-graalvm")
include("apache4")
include("graalvm")
include("jetty")
include("jettyloom-jdbc")
include("jettyloom-pgclient")
include("helidon-jdbc")
include("helidon-pgclient")
include("ktorcio")
include("ktornetty")
include("netty")
include("ratpack")
include("sunhttp")
include("sunhttploom")
include("undertow")
