<template>
    <div class="z-50 bottom-0 h-full w-full">
        <div class=" py-2 w-full">
            <div class="flex items-center justify-between">
                <div  class="flex items-center text-white">
                    <img class="rounded-full h-[35px]" :src="post.image">
                    <div class="ml-2 font-semibold text-[18px]">{{ post.name }}</div>
                </div>
                <div 
                    v-if="user && user.identities && user.identities[0].user_id == post.userId" 
                    @click="isMenu = !isMenu" class="relative"
                >
                    <button 
                        :disabled="isDeleting"
                        class="flex items-center text-white p-1 h-[24px] w-[24px] hover:bg-gray-800 rounded-full cursor-pointer" 
                        :class="isMenu ? 'bg-gray-800' : ''"
                    >
                        <Icon v-if="!isDeleting" name="bi:three-dots" color="#ffffff" size="18"/>
                        <Icon v-else name="eos-icons:bubble-loading" color="#ffffff" size="18"/>
                    </button>

                    <div v-if="isMenu" class="absolute border border-gray-600 right-0 z-20 mt-1 rounded">
                        <button 
                            @click="deletePost(post.id, post.picture)" 
                            class="flex items-center rounded gap-2 text-red-500 justify-between bg-black w-full pl-4 pr-3 py-1 hover:bg-gray-900"
                        >
                            <div>Delete</div>
                            <Icon name="solar:trash-bin-trash-broken" size="20"/>
                        </button>
                    </div>
                </div>
            </div>

            <div class="relative flex items-center w-full">
                <div class="w-[42px] mx-auto">
                    <div class="absolute ml-4 mt-1 top-0 w-[1px] bg-gray-700 h-full" />
                </div>
                <div class="bg-black rounded-lg w-[calc(100%-50px)] text-sm w-full font-light">
                    <div class="py-2 text-gray-300">{{ post.text }}</div>
                    <img 
                        v-if="post && post.picture"
                        class="mx-auto w-full mt-2 pr-2 rounded" 
                        :src="runtimeConfig.public.bucketUrl + post.picture" 
                    />

                    <div class="absolute mt-2 w-full ml-2">
                        <button 
                            :disabled="isLike"
                            @click="likesFunc()" 
                            class="flex items-center gap-1"
                        >
                            <Icon 
                                v-if="!hasLikedComputed"
                                class="p-1 text-white hover:bg-gray-800 rounded-full cursor-pointer" 
                                name="mdi:cards-heart-outline" 
                                size="28"
                            />
                            <Icon 
                                v-else
                                class="p-1 text-red-500 hover:bg-gray-800 rounded-full cursor-pointer" 
                                name="mdi:cards-heart" 
                                size="28"
                            />
                        </button>
                        <div class="relative text-sm text-gray-500">
                            <div> 
                                <span v-if="!isLike">{{ post.likes.length }}</span>
                                <span v-else>
                                    <Icon name="eos-icons:bubble-loading" color="#ffffff" size="13"/>
                                </span>
                                likes
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="relative inline-block text-gray-500 pt-1 pb-1.5">
            <div class="flex items-center">
                <div  class="flex items-center flex-wrap text-white gap-1 w-[42px]">
                    <div class="flex gap-0.5">
                        <img class="rounded-full h-[14px] mt-2" src="https://picsum.photos/id/202/50">
                        <img class="rounded-full h-[17px]" src="https://picsum.photos/id/223/50">
                    </div>
                    <div class="flex items-center">
                        <img class="rounded-full h-[11px] ml-4" src="https://picsum.photos/id/99/50">
                    </div>
                </div>
            </div>
        </div>

        <div class="h-[1px] bg-gray-800 w-full mt-3" />
    </div>
</template>

<script setup>
import { useUserStore } from '~/stores/user';
const userStore = useUserStore()

const runtimeConfig = useRuntimeConfig()
let isMenu = ref(false)
let isLike = ref(false)
let isDeleting = ref(false)

const emit = defineEmits(['isDeleted'])
const props = defineProps({ post: Object })

const client = useSupabaseClient()
const user = useSupabaseUser()

const hasLikedComputed = computed(() => {
    if (!user.value) return 
    let res = false
    props.post.likes.forEach(like => {
        if (like.userId == user.value.identities[0].user_id && like.postId == props.post.id) {
            res = true
        }
    });

    return res
})

const deletePost = async (id, picture) => {
    let res = confirm('Are you sure you want to delete this post?')

    if (!res) return 

    try {
        isMenu.value = false
        isDeleting.value = true
        const { data, error } = await client
            .storage
            .from('threads-c-files')
            .remove([picture])

        await useFetch(`/api/delete-post/${id}`, { method: 'DELETE' })
        emit('isDeleted', true)

        isDeleting.value = false
    } catch (error) {
        console.log(error)
        isDeleting.value = false
    }
}

const likePost = async (id) => {
    isLike.value = true
    try {
        await useFetch(`/api/like-post/`, {
            method: 'POST',
            body: {
                userId: user.value.identities[0].user_id,
                postId: id,
            }
        })
        await userStore.getAllPosts()
        isLike.value = false
    } catch (error) {
        console.log(error)
        isLike.value = false
    }
}

const unlikePost = async (id) => {
    isLike.value = true
    try {
        await useFetch(`/api/unlike-post/${id}`, { method: 'DELETE' })
        await userStore.getAllPosts()
        isLike.value = false
    } catch (error) {
        console.log(error)
        isLike.value = false
    }
}

const likesFunc = () => {
    let likePostObj = null

    if (props.post.likes.length < 1) {
        likePost(props.post.id)
        return null
    } else {
        props.post.likes.forEach(like => {
            if (like.userId == user.value.identities[0].user_id && like.postId == props.post.id) {
                likePostObj = like
            }
        });
    }

    if (likePostObj) {
        unlikePost(likePostObj.id)
        return null
    }

    likePost(props.post.id)
}
</script>