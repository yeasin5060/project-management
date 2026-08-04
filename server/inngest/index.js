import { Inngest } from "inngest";
import { prisma } from "../src/db.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

// ✅ inngest function to the create a user
const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [{ event: "clerk/user.created" }],
  },
  async ({ event }) => {
        const {data} = event
        await prisma.user.create({
            data : {
                id : data.id,
                email: data?.email_addresses?.[0]?.email_address,
                name: `${data?.first_name || ""} ${data?.last_name || ""}`.trim(),
                image: data?.image_url,
            }
        })
  }
);

// ✅ inngest function to the Delete user

const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-with-clerk",
    triggers: [{ event: "clerk/user.deleted" }],
  },

  async ({ event }) => {
    const { data } = event;
    await prisma.user.delete({
        where : {id : data.id}
    })
    
  }
);

// ✅ inngest function to the Update user

const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [{ event: "clerk/user.updated" }],
  },
  async ({ event }) => {
    const {data} = event;

    await prisma.user.update({
        where : {id : data.id},
        data : {
            email:data?.email_addresses[0].email_address,
            name:data?.first_name + " " +data?.last_name,
            image:data?.image_url,
        }
    })
  }
);

// inngest function to save workspace data to a database

const syncWorkspaseCreation = inngest.createFunction(
   {
    id: "sync-workspace-from-clerk",
    triggers: [{ event: "clerk/organization.created" }],
  },

  async({event}) => {
    const {data} = event
    await prisma.workspace.create({
      data : {
        id : data.id,
        name : data.name,
        slug : data.slug,
        ownerId : data.created_by,
        image_url : data.image_url
      }
    });
    // add creator as ADMIN member
    await prisma.workspaceMember.create({
      data : {
        userId :  data.created_by,
        workspaceId : data.id,
        role : "ADMIN"
      }
    })
  }
)

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];