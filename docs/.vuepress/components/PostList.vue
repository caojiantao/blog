<template>
    <div>
        <template v-for="page in $site.pages">
            <div class="post-item" v-if="isCurrentCategory(page)">
                <div class="post-item-title">
                    <a :href="page.path">{{ page.title }}</a>
                </div>
                <div class="post-item-info">
                    {{ page.frontmatter.date || page.lastUpdated }}
                </div>
            </div>
        </template>
    </div>
</template>

<script>
export default {
    data() {
        return {
        }
    },
    mounted() {
    },
    methods: {
        isCurrentCategory: function (page) {
            // 同目录下的文件集合
            return page.regularPath.startsWith(this.$page.regularPath);
        }
    }
}
</script>

<style>
.post-item {
    padding: 1.5rem;
}

.post-item-title {
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
    line-height: 1.75rem;
}

.post-item-info {
    color: grey;
}
</style>
