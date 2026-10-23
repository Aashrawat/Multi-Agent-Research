from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from tools import search_web, scrape_url
from dotenv import load_dotenv

load_dotenv()

#model setup
llm=ChatOpenAI(model="gpt-4o-mini", temperature=0)

#1st agent: Search and scrape the web

def build_search_agent():
    return create_agent(
        model = llm,
        tools = [search_web]
    )

##2nd agent

def build_reader_agent():
    return create_agent(
        model = llm,
        tools = [scrape_url]

    )

#writer chain

writer_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that writes a concise summary of the given text."),
    ("human","""Write a detailed research report on the topic below. Topic {topic}
    Research Gathered: {research}
    Structure the report in the following sections:
    Introduction: Provide a brief overview of the topic.
    Key Findings: Summarize the main points and insights.
    Conclusion: Summarize the main points and insights.
    Sources: List the sources used to gather the information.
    Be detailed, concise, and well-structured."""),
])

writer_chain = writer_prompt | llm | StrOutputParser()

#critic chain

critic_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that critiques the given text and provides feedback on the quality of the writing."),
    ("human","""Critique the following text and provide feedback on the quality of the writing. Report: {report}
    Respond in this exact format:
    Score: X/10
    Strength:
    - ...
    - ...

    Areas to improve:
    - ...
    - ...

    One line verdict:
    - ..."""),
])

critic_chain = critic_prompt | llm | StrOutputParser()