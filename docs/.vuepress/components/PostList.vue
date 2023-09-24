<template>
    <div>
        <template v-for="page in pages">
            <div class="post-item">
                <div class="post-item-title">
                    <a :href="page.path">{{ page.title }}</a>
                </div>
                <div class="post-item-info">
                    {{ page.date }}
                </div>
            </div>
        </template>
    </div>
</template>

<script>
import moment from 'moment'

export default {
    data() {
        return {
            pages: []
        }
    },
    mounted() {
        this.pages = this.$site.pages.filter(page => this.isCurrentCategory(page))
            .map(page => {
                return {
                    title: page.title,
                    date: moment(page.frontmatter.date || page.lastUpdated).format('yyyy-MM-DD'),
                    path: page.path,
                }
            });
        this.pages.sort((k1, k2) => {
            return moment(k2.date) - moment(k1.date);
        })

    },
    methods: {
        isCurrentCategory: function (page) {
            // 同目录下的文件集合
            return page.regularPath.startsWith(this.$page.regularPath)
                && page.regularPath != this.$page.regularPath;
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
